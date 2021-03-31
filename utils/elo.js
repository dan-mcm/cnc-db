const axios = require('axios').default;
const dotenv = require('dotenv').config();
const DB = require('./dbQueries.js');
const parser = require('./dataFilter.js').dataUploadFilter;
const { Pool } = require('pg');
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
  filteredData.map(game => {
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

function eloCalculationsRawRevised(data) {
  const filteredOutput = [];
  const defaultStartingElo = 1000;
  let p1Elo = 0;
  let p2Elo = 0;

  data.map(game => {
    const p1Exists =
      filteredOutput.some(
        recordedGame => recordedGame.player1_name === game.player1_name
      ) ||
      filteredOutput.some(
        recordedGame => recordedGame.player2_name === game.player1_name
      );
    const p2Exists =
      filteredOutput.some(
        recordedGame => recordedGame.player2_name === game.player2_name
      ) ||
      filteredOutput.some(
        recordedGame => recordedGame.player1_name === game.player2_name
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
  dataArray.map(match => {
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
      const index = output.findIndex(player => player.name === decodedPlayer1);

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
      const index = output.findIndex(player => player.name === decodedPlayer2);

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
    if (rank <= 16) {
      return 'general';
    } else if (rank <= 200) {
      return 'major';
    } else if (rank <= 400) {
      return 'captain';
    } else if (rank <= 600) {
      return 'lieutenant';
    } else {
      return 'sergeant';
    }
  }

// TODO - add player ids
function leaderboardUpdate(data, season){
  data.map((player,index) => {
    let playerName = player.name
    let playerPoints = player.current_elo
    let wins = player.games.filter(game => game.result === 'W').length
    let loss = player.games.filter(game => game.result === 'L').length
    let played = player.games.length
    let winrate = Math.floor(wins / played * 100)
    let position = index + 1 // offsetting for 0 index
    let rank = getRank(position)
    return DB.addLeaderboard(
      playerName,
      season,
      rank,
      position,
      playerPoints,
      wins,
      loss,
      played,
      winrate
    )
  })
}

// TODO - add player ids
function historyUpdate(games, season){
  games.map(game => {
    let decodedPlayer1 = utf8.decode(eval("'" + game.player1_name + "'"));
    let decodedPlayer2 = utf8.decode(eval("'" + game.player2_name + "'"));
    return DB.addHistory(
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
      game.result === decodedPlayer2 ? true : false,
      season
    )
  })
}

function eloUpdate(season){
  let pool;

  if (process.env.NODE_ENV === 'production') {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    });
  }

  pool
    .connect()
    .then(client => {
      return client
        .query(
          `SELECT distinct(starttime) starttime, match_duration, player1_name, player1_faction, player1_random, player2_name, player2_faction, player2_random, result, map, replay, season FROM matches  WHERE season=${season} order by starttime ASC`
        )
    })
    .then(res => {
      const eloAddition = eloCalculationsRawRevised(res.rows);

      // update elo history
      historyUpdate(eloAddition, season)

      const translatedData = dbdataTranslation(eloAddition).sort((a, b) => (a.current_elo > b.current_elo ? -1 : 1));
      // update leaderboard
      leaderboardUpdate(translatedData, season)
    })
    .catch(e => {
        console.log(e.stack);
        client.release();
      })
    .finally(
      () =>
      {
        return pool.end()
      }
    );
  }

// drop existing table
DB.dropTable('leaderboard')
  .then(res =>
    // create new table
    DB.createLeaderboard()
  )
  .then(res =>
    // drop elo history
    DB.dropTable('elo_history')
  )
  .then(res =>
    // update elo history
    DB.createHistory()
  )
  .then(res =>
    // apply s3 update
    eloUpdate(3)
  )
  // .then(res =>
  //   // apply s4 update
  //   eloUpdate(4)
  // )
  .catch(err =>
  console.log(err)
)
