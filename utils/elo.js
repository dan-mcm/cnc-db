const dotenv = require('dotenv').config();
const DB = require('./dbQueries.js');
const utf8 = require('utf8');

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
    const decodedPlayer1 = utf8.decode(eval("'" + match.player1_name + "'"));
    const decodedPlayer2 = utf8.decode(eval("'" + match.player2_name + "'"));

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
function leaderboardUpdate(pool, data, season) {
  return data.map((player, index) => {
    const playerName = player.name;
    const playerPoints = player.current_elo;
    const wins = player.games.filter((game) => game.result === 'W').length;
    const loss = player.games.filter((game) => game.result === 'L').length;
    const played = player.games.length;
    const winrate = Math.floor((wins / played) * 100);
    const position = index + 1; // offsetting for 0 index
    const rank = getRank(position);

    DB.getPlayersCurrentLeaderboardIndex(pool, playerName, season)
      .then((res) => {
        if (res > 0) {
          // if player already on leaderboard, overwrite position
          return DB.overridePlayersLeaderboardPosition(
            pool,
            res, // players current index in table
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
          // if player not on leaderboard, add as new entry
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
      })
      .catch((err) => console.log(err));
  });
}

// TODO - add player ids
function historyUpdate(pool, games, season) {
  return games.map((game) => {
    const decodedPlayer1 = utf8.decode(eval("'" + game.player1_name + "'"));
    const decodedPlayer2 = utf8.decode(eval("'" + game.player2_name + "'"));

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

function eloUpdate(pool, season) {
  // expect this to return array of objects -> top of which should be most recent starttime
  return DB.getExistingSeasonEloMatches(pool, season)
    .then((result) => {
      const existingMatches = result;
      let limit = existingMatches[0].starttime; // should be most recent elo game previously stored
      if (limit === undefined) limit = 0.0;
      // let starttime = most recent elo game
      // expect this to only return additional matches
      return DB.getSpecificSeasonMatches(pool, season, limit).then((res) => {
        // update elo history (newMatches, existingElo)
        const eloAddition = eloCalculationsRawRevised(res, existingMatches);
        historyUpdate(pool, eloAddition, season);
        const translatedData = dbdataTranslation(eloAddition).sort((a, b) =>
          a.current_elo > b.current_elo ? -1 : 1
        );

        // update leaderboard ✔️
        leaderboardUpdate(pool, translatedData, season);
      });
    })
    .then(() => console.log(`Starting elo update for season ${season}`))
    .catch((e) => {
      console.log(e.stack);
      client.release();
    });
}

// based on current time, determining what season to use
function seasonalUpdates(pool) {
  // 2021 months
  const jan = 1609459200;
  const apr = 1617235200;
  const july = 1625097600;
  const oct = 1633046400;
  // 2022 months
  const jan2 = 1640995200;

  const starttime = Date.now() / 1000;

  if (starttime >= jan2) return eloUpdate(pool, 8);
  if (starttime >= oct && starttime < jan2) return eloUpdate(pool, 7);
  if (starttime >= july && starttime < oct) return eloUpdate(pool, 6);
  if (starttime >= apr && starttime < july) return eloUpdate(pool, 5);
  if (starttime > jan && starttime < apr) {
    return Promise.all([eloUpdate(pool, 4), eloUpdate(pool, 3)]).then(() =>
      console.log('Elo & Leaderboard Table Updates Complete.')
    );
  }
}

function regenerateEloTables(pool) {
  return seasonalUpdates(pool);
}

module.exports = {
  regenerateEloTables
};
