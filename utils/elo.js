const dotenv = require('dotenv').config();
const DB = require('./dbQueries.js');
const eloUpdateWorker = require('./eloUpdateWorker.js')
const utf8 = require('utf8');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

function eloCalculator(p1, p2, p1Result) {
  // A p1_result of true means player 1 was winner.
  const EloRating = require('elo-rating');
  const player1 = p1;
  const player2 = p2;
  const p1Score = EloRating.calculate(player1, player2, p1Result, 32);
  return p1Score;
}

function getElo(filteredData, playerName) {
  const matches = [];
  filteredData.map((game) => {
    if (game.player1_name === playerName) {
      matches.push(game);
    }

    if (game.player2_name === playerName) {
      matches.push(game);
    }
  });

  matches.sort((a, b) => (a.starttime > b.starttime ? 1 : -1));

  if (matches.length > 0) {
    return matches[matches.length - 1].player1_name === playerName
      ? matches[matches.length - 1].player1_elo_after
      : matches[matches.length - 1].player2_elo_after;
  }

  return 1000;
}

function eloCalculationsRawRevised(newMatches, existingElo) {
  const filteredOutput = [existingElo]; // creating array and adding our existing elo data to it (may need formatting)
  const defaultStartingElo = 1000;
  let p1Elo = 0;
  let p2Elo = 0;
  newMatches.map((game) => {
    const p1Exists =
      filteredOutput.some(
        (recordedGame) => recordedGame.player1_name === game.player1_name
      ) ||
      filteredOutput.some(
        (recordedGame) => recordedGame.player2_name === game.player1_name
      );
    const p2Exists =
      filteredOutput.some(
        (recordedGame) => recordedGame.player2_name === game.player2_name
      ) ||
      filteredOutput.some(
        (recordedGame) => recordedGame.player1_name === game.player2_name
      );

    // Not exist case
    p1Elo = !p1Exists
      ? defaultStartingElo
      : getElo(filteredOutput, game.player1_name);
    p2Elo = !p2Exists
      ? defaultStartingElo
      : getElo(filteredOutput, game.player2_name);

    // Set out existing elo values to game object
    game.player1_elo_before = p1Elo;
    game.player2_elo_before = p2Elo;

    // Calculating newElo
    const afterElo = eloCalculator(
      game.player1_elo_before,
      game.player2_elo_before,
      game.player1_name === game.result
    );

    // Set out new elo values to game object
    game.player1_elo_after = afterElo.playerRating;
    game.player2_elo_after = afterElo.opponentRating;

    filteredOutput.push(game);
    return game;
  });

  return filteredOutput;
}

function dbdataTranslation(dataArray) {
  const listedPlayers = [];
  const output = [];
  dataArray.map((match) => {
    // Default case if we haven't encountered player1 yet...
    
    const decodedPlayer1 = safeDecodeURIComponent(match.player1_name, match, 'dbdataTranslation');
    const decodedPlayer2 = safeDecodeURIComponent(match.player2_name, match, 'dbdataTranslation');

    if (!listedPlayers.includes(decodedPlayer1)) {
      const frontend = {
        name: '',
        current_elo: 1000,
        games: []
      };

      listedPlayers.push(decodedPlayer1);
      frontend.name = decodedPlayer1;
      frontend.current_elo = getElo(dataArray, decodedPlayer1);

      frontend.games.push({
        date: match.starttime,
        duration: match.match_duration,
        opponent: decodedPlayer2,
        opponent_faction: match.player2_faction,
        player_faction: match.player1_faction,
        player_random: match.player1_random,
        opponent_random: match.player2_random,
        player_existing_elo: match.player1_elo_before,
        player_new_elo: match.player1_elo_after,
        opponent_existing_elo: match.player2_elo_before,
        opponent_new_elo: match.player2_elo_after,
        map: match.map,
        replay: `https://replays.cnctdra.ea.com/${match.replay}`,
        result: match.result === decodedPlayer1 ? 'W' : 'L'
      });
      output.push(frontend);
    } else if (listedPlayers.includes(decodedPlayer1)) {
      // Second case if we have encountered player1 yet...
      const index = output.findIndex(
        (player) => player.name === decodedPlayer1
      );

      output[index].games.push({
        date: match.starttime,
        duration: match.match_duration,
        opponent: decodedPlayer2,
        opponent_faction: match.player2_faction,
        player_faction: match.player1_faction,
        player_random: match.player1_random,
        opponent_random: match.player2_random,
        player_existing_elo: match.player1_elo_before,
        player_new_elo: match.player1_elo_after,
        opponent_existing_elo: match.player2_elo_before,
        opponent_new_elo: match.player2_elo_after,
        map: match.map,
        replay: `https://replays.cnctdra.ea.com/${match.replay}`,
        result: match.result === decodedPlayer1 ? 'W' : 'L'
      });
    }

    // Updating player 2 default case
    // Default case if we haven't encountered player1 yet...
    if (!listedPlayers.includes(decodedPlayer2)) {
      const frontend = {
        name: '',
        current_elo: 1000,
        games: []
      };
      listedPlayers.push(decodedPlayer2);
      frontend.name = decodedPlayer2;
      frontend.current_elo = getElo(dataArray, decodedPlayer2);
      frontend.games.push({
        date: match.starttime,
        duration: match.match_duration,
        opponent: decodedPlayer1,
        opponent_faction: match.player1_faction,
        player_faction: match.player2_faction,
        player_random: match.player2_random,
        opponent_random: match.player1_random,
        player_existing_elo: match.player2_elo_before,
        player_new_elo: match.player2_elo_after,
        opponent_existing_elo: match.player1_elo_before,
        opponent_new_elo: match.player1_elo_after,
        map: match.map,
        replay: `https://replays.cnctdra.ea.com/${match.replay}`,
        result: match.result === decodedPlayer2 ? 'W' : 'L'
      });
      output.push(frontend);
    } else if (listedPlayers.includes(decodedPlayer2)) {
      // Second case if we have encountered player2 yet...
      const index = output.findIndex(
        (player) => player.name === decodedPlayer2
      );

      output[index].games.push({
        date: match.starttime,
        duration: match.match_duration,
        opponent: decodedPlayer1,
        opponent_faction: match.player1_faction,
        player_faction: match.player2_faction,
        player_random: match.player2_random,
        opponent_random: match.player1_random,
        player_existing_elo: match.player2_elo_before,
        player_new_elo: match.player2_elo_after,
        opponent_existing_elo: match.player1_elo_before,
        opponent_new_elo: match.player1_elo_after,
        map: match.map,
        replay: `https://replays.cnctdra.ea.com/${match.replay}`,
        result: match.result === decodedPlayer2 ? 'W' : 'L'
      });
    }
  });

  return output;
}

function getRank(rank) {
  if (rank <= 16) return 'general';
  if (rank <= 200) return 'major';
  if (rank <= 400) return 'captain';
  if (rank <= 600) return 'lieutenant';
  return 'sergeant';
}

// TODO - add player ids
async function leaderboardUpdate(pool, data, season) {
  console.log('triggering leaderboardUpate');
  const leaderboardUpdates = data.map(async (player, index) => {
    try {
      const playerName = player.name;
      const playerPoints = player.current_elo;
      const wins = player.games.filter((game) => game.result === 'W').length;
      const loss = player.games.filter((game) => game.result === 'L').length;
      const played = player.games.length;
      const winrate = Math.floor((wins / played) * 100);
      const position = index + 1; // offsetting for 0 index
      const rank = getRank(position);

      const res = await DB.getPlayersCurrentLeaderboardIndex(pool, playerName, season);

      if (res > 0) {
        // If player already on leaderboard, overwrite position
        return DB.overridePlayersLeaderboardPosition(
          pool,
          res, // Player's current index in table
          playerName,
          season,
          rank,
          position,
          playerPoints,
          wins,
          loss,
          played,
          winrate
        );
      } else {
        // If player not on leaderboard, add as a new entry
        return DB.addLeaderboard(
          pool,
          playerName,
          season,
          rank,
          position,
          playerPoints,
          wins,
          loss,
          played,
          winrate
        );
      }
    } catch (err) {
      // Handle errors here or log them
      console.error('Error in leaderboardUpdate:', err);
      // You can choose to rethrow the error or continue processing other items
      // throw err;
    }
  });

  try {
    // Wait for all leaderboard updates to complete
    await Promise.all(leaderboardUpdates);
    console.log('Leaderboard updates completed.');
  } catch (error) {
    // Handle errors that occurred during the updates
    console.error('Error during leaderboard updates:', error);
    // You can choose to rethrow the error or handle it as needed
    // throw error;
  }
}

// TODO - add player ids
function historyUpdate(pool, games, season) {
  console.log(`Triggering historyUpdate`)
  return games.map((game) => {
    const decodedPlayer1 = safeDecodeURIComponent(game.player1_name, game, 'historyUpdate');
    const decodedPlayer2 = safeDecodeURIComponent(game.player2_name, game, 'historyUpdate');

    return DB.addHistory(
      pool,
      game.starttime,
      game.match_duration,
      decodedPlayer1,
      game.player1_faction,
      game.player1_random,
      game.player1_elo_before,
      game.player1_elo_after,
      decodedPlayer2,
      game.player2_faction,
      game.player2_random,
      game.player2_elo_before,
      game.player2_elo_after,
      game.map,
      `https://replays.cnctdra.ea.com/${game.replay}`,
      game.result === decodedPlayer2,
      season
    );
  });
}

async function eloUpdate(pool, season) {
  console.log(`Starting eloUpdate for: ${season}`)
  try {
    let limit = 0.0;
    const existingMatches = await DB.getExistingSeasonEloMatches(pool, season);
    
    if (existingMatches.length === 0) {
      console.log('No existing matches found for season', season);
      // return;
    } else {
      limit = existingMatches[0].starttime || 0.0;
    }

    // Check if the client is already released before releasing it
    // if (client && !client._ending) {
    //   client.release();
    // }

    const res = await DB.getSpecificSeasonMatches(pool, season, limit);
    
    const eloAddition = eloCalculationsRawRevised(res, existingMatches);

    historyUpdate(pool, eloAddition, season);
    
    const translatedData = dbdataTranslation(eloAddition).sort((a, b) =>
      a.current_elo > b.current_elo ? -1 : 1
    );

    leaderboardUpdate(pool, translatedData, season);
    // client.release();
    // console.log(`Starting elo update for season ${season}`);
  } catch (error) {
    console.log(`error in eloUpdate function: ${error}`)
    console.error(error.stack);
    // client.release();
  }
}

function getSeasonFromDate(date) {
  // Define the start dates for each season as Unix timestamps
  // these are obtainable via the leaderboard list query endpoint
  const seasonStartDates = [
    { season: 14, startDate: 1693522801 }, // September 2023 // 2023-09-01T00:00:01.442857
    { season: 13, startDate: 1685574000 }, // June 2023  // 2023-06-01T00:00:00.29734
    { season: 12, startDate: 1677628799 }, // March 2023 // 2023-02-28T23:59:59.978612

    { season: 11, startDate: 1669852801 }, // December 2022 // 2022-12-01T00:00:01.204621
    { season: 10, startDate: 1661986800 }, // September 2022 // 2022-09-01T00:00:00.134442
    { season: 9, startDate: 1654037999 }, // June 2022 // 2022-05-31T23:59:59.790186
    { season: 8, startDate: 1646092800 }, // March 2022 // 2022-03-01T00:00:00.525261

    { season: 7, startDate: 1638316800 }, // December 2021 // 2021-12-01T00:00:00.475807
    { season: 6, startDate: 1630450799 }, // September 2021 // 2021-08-31T23:59:59.985442
    { season: 5, startDate: 1622502001 }, // June 2021 // 2021-06-01T00:00:01.108728
    { season: 4, startDate: 1615900791 }, // March 2021 // 2021-03-16T13:19:51.430553

    // Pre season-4 logic dicey... needs to be investigated manually...
    { season: 3, startDate: 1609459200 }, // January 2021 // 2020-09-17T12:34:19.147524 2021-03-16T13:19:51.430553
    { season: 2, startDate: 1601510400 }, // October 2020// 2020-08-10T18:13:02.544681 
    { season: 1, startDate: 1593561600 }, // July 2020 // 2020-08-06T17:57:34.788946
  ];

  // Iterate through the start dates to find the current season
  for (const seasonInfo of seasonStartDates) {
    if (date >= seasonInfo.startDate) {
      return seasonInfo.season;
    }
  }

  // Default to the latest season if none of the start dates match
  return seasonStartDates[seasonStartDates.length - 1].season;
}

// based on current time, determining what season to use
async function seasonalUpdates() {

  const currentSeason = getSeasonFromDate(Date.now() / 1000);
  console.log(`Seasonal Updates current season value: ${currentSeason}`)
  
  const pool = DB.createPool();
  const client = await pool.connect();

  // for(let season=1; season<=currentSeason; season++){
  //   eloUpdate(pool, season, client);
  // }
  eloUpdate(pool, 14, client);
}

// async function seasonalUpdates() {
//   const currentSeason = getSeasonFromDate(Date.now() / 1000);
//   const workerPromises = [];

//   for (let season = 1; season <= currentSeason; season++) {
//     const worker = new Worker(`${__dirname}/eloUpdateWorker.js`, {
//       workerData: season },
//     );

//     const workerPromise = new Promise((resolve, reject) => {
//       worker.on('message', (message) => {
//         console.log(message);
//         resolve();
//       });
//       worker.on('error', (error) => {
//         console.error(error);
//         reject(error);
//       });
//       worker.on('exit', (code) => {
//         if (code !== 0) {
//           reject(new Error(`Worker stopped with exit code ${code}`));
//         }
//       });
//     });

//     workerPromises.push(workerPromise);
//   }

//   await Promise.all(workerPromises);
// }

function regenerateEloTables() {
  return seasonalUpdates();
}

function safeDecodeURIComponent(uriComponent, all, debug) {
  
  try {
    if (typeof uriComponent !== 'string') {
      console.log(JSON.stringify(all))
      // Handle cases where uriComponent is not a string
      console.error('URI component is not a string:', uriComponent);
      console.log(`debug: ${debug}`)
      return ''; // Return a default value or an empty string
    }

    // Replace invalid characters with valid ones
    const sanitizedComponent = uriComponent
      .replace(/[^\w\d\-_.!~*'()]/g, '_')
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

    // Decode the sanitized component
    return decodeURIComponent(sanitizedComponent);
  } catch (error) {
    // Handle URI decoding errors
    console.error('Error decoding URI component:', error);
    return ''; // Return a default value or an empty string
  }
}


module.exports = {
  regenerateEloTables,
  eloUpdate
};
