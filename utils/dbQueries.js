const { Pool } = require('pg');
const dotenv = require('dotenv').config();

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

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

function getAllMatches() {
  return pool
    .connect()
    .then(client => {
      return client
        .query('SELECT * FROM matches')
        .then(res => {
          client.release()
          return res.rows
        })
        .catch(err => {
          console.log(err.stack)
          client.release()
        })
    })
};

function getLatestTotal(){
  return pool
    .connect()
    .then(client => {
      return client
        .query('SELECT total FROM totals ORDER BY date_inserted DESC LIMIT 1')
        .then(res => {
          client.release()
          return res.rows[0].total
        })
        .catch(err => {
          console.log(err.stack)
          client.release()
        })
    })
}

function addLeaderboard(player_name, season, rank, position, points, wins, loses, played, winrate) {
  // console.log(`IN ADD MATCHES`)
  return pool
    .connect()
    .then(client => {
      return client
        .query(
          `INSERT INTO leaderboard (player_name, season, rank, position, points, wins, loses, played, winrate)
          VALUES ('${player_name}', '${season}', '${rank}', '${position}', '${points}', '${wins}', '${loses}', '${played}', '${winrate}')`
        )
        .then(res => {
          client.release()
          return res
        })
        .catch(err => {
          console.log(err.stack)
          client.release()
        })
    })
};

function addMatches(starttime, matchDuration, player1_id, player1Name, player1Faction, player1Random, player2_id, player2Name, player2Faction, player2Random, result, map, replay, season) {
  // console.log(`IN ADD MATCHES`)
  return pool
    .connect()
    .then(client => {
      return client
        .query(
          `INSERT INTO matches (starttime, match_duration, player1_id, player1_name, player1_faction, player1_random, player2_id, player2_name, player2_faction, player2_random, result, map, replay, season)
          VALUES ('${starttime}', '${matchDuration}', '${player1_id}', '${player1Name}', '${player1Faction}', '${player1Random}', '${player2_id}', '${player2Name}', '${player2Faction}', '${player2Random}', '${result}', '${map}', '${replay}', '${season}')`
        )
        .then(res => {
          client.release()
          return res
        })
        .catch(err => {

          console.log(err.stack)
          client.release()
        })
    })
};

const addMatchesAsync = async function(starttime, matchDuration, player1_id, player1Name, player1Faction, player1Random, player2_id, player2Name, player2Faction, player2Random, result, map, replay, season) {
  // console.log(`IN ADD MATCHESASYNC`)
  const client = await pool.connect()
  try{
    const res = await pool.query(
      `INSERT INTO matches (starttime, match_duration, player1_id, player1_name, player1_faction, player1_random, player2_id, player2_name, player2_faction, player2_random, result, map, replay, season)
      VALUES ('${starttime}', '${matchDuration}', '${player1_id}', '${player1Name}', '${player1Faction}', '${player1Random}', '${player2_id}', '${player2Name}', '${player2Faction}', '${player2Random}', '${result}', '${map}', '${replay}', '${season}')`,
      (err, res) => {
        if (err) {
          console.log(err);
        } else {
          console.log(res);
          return res;
        }

        // Syntax used to hide error logging of pool end > once
        // pool.end(() => {});
      }
    );
    console.log(`SUCCESS!!! ${res}`)
  } finally {
    client.release()
  }
};

function addTotal(total) {
  return pool
    .connect()
    .then(client => {
      return client
        .query(`INSERT INTO totals (total) VALUES ('${total}')`)
        .then(res => {
          client.release()
          return res
        })
        .catch(err => {
          console.log(err.stack)
          client.release()
        })
    })
};

function dropTable(table) {
  return pool
    .connect()
    .then(client => {
      return client
        .query(`DROP TABLE ${table}`)
        .then(res => {
          client.release()
          return res
        })
        .catch(err => {
          console.log(err.stack)
          client.release()
        })
    })
};

function createLeaderboard() {
  return pool
    .connect()
    .then(client => {
      return client
        .query(`CREATE TABLE leaderboard(
          index serial,
          player_name varchar(255) NOT NULL,
          season INT NOT NULL,
          rank varchar(255) NOT NULL,
          position INT NOT NULL,
          points INT NOT NULL,
          wins INT,
          loses INT,
          played INT,
          winrate INT
        )`)
        .then(res => {
          client.release()
          return res
        })
        .catch(err => {
          console.log(err.stack)
          client.release()
        })
    })
};

function createLeaderboard() {
  return pool
    .connect()
    .then(client => {
      return client
        .query(`CREATE TABLE leaderboard(
          index serial,
          player_name varchar(255) NOT NULL,
          season INT NOT NULL,
          rank varchar(255) NOT NULL,
          position INT NOT NULL,
          points INT NOT NULL,
          wins INT,
          loses INT,
          played INT,
          winrate INT
        )`)
        .then(res => {
          client.release()
          return res
        })
        .catch(err => {
          console.log(err.stack)
          client.release()
        })
    })
};

function createHistory() {
  return pool
    .connect()
    .then(client => {
      return client
        .query(`CREATE TABLE elo_history(
          index serial,
          starttime FLOAT,
          duration FLOAT,
          player varchar(255),
          player_faction varchar(3),
          player_random BOOLEAN,
          player_existing_elo INT,
          player_new_elo INT,
          opponent varchar(255),
          opponent_faction varchar(3),
          opponent_random BOOLEAN,
          opponent_existing_elo INT,
          opponent_new_elo INT,
          map varchar(255),
          replay varchar(255),
          result BOOLEAN,
          season INT
        )`)
        .then(res => {
          client.release()
          return res
        })
        .catch(err => {
          console.log(err.stack)
          client.release()
        })
    })
};

function addHistory(
  starttime,
  matchDuration,
  playerName,
  playerFaction,
  playerRandom,
  playerExistingElo,
  playerNewElo,
  opponentName,
  opponentFaction,
  opponentRandom,
  opponentExistingElo,
  opponentNewElo,
  map,
  replay,
  result,
  season
){
  return pool
    .connect()
    .then(client => {
      return client
        .query(
          `INSERT INTO elo_history (
            starttime,
            duration,
            player,
            player_faction,
            player_random,
            player_existing_elo,
            player_new_elo,
            opponent,
            opponent_faction,
            opponent_random,
            opponent_existing_elo,
            opponent_new_elo,
            map,
            replay,
            result,
            season)
          VALUES (
            '${starttime}',
            '${matchDuration}',
            '${playerName}',
            '${playerFaction}',
            '${playerRandom}',
            '${playerExistingElo}',
            '${playerNewElo}',
            '${opponentName}',
            '${opponentFaction}',
            '${opponentRandom}',
            '${opponentExistingElo}',
            '${opponentNewElo}',
            '${map}',
            '${replay}',
            '${result}',
            '${season}'
          )`
        )
        .then(res => {
          client.release()
          return res
        })
        .catch(err => {
          console.log(err.stack)
          client.release()
        })
    })
}
//
// function addAwards(
//   most_gdi,
//   most_gdi_total,
//   most_nod,
//   most_nod_total,
//   most_random,
//   most_random_total,
//   most_overall,
//   most_overall_total,
//   season
// ){
//   return pool
//     .connect()
//     .then(client => {
//       return client
//         .query(
//           `INSERT INTO awards (
//             most_gdi,
//             most_gdi_total,
//             most_nod,
//             most_nod_total,
//             most_random,
//             most_random_total,
//             most_overall,
//             most_overall_total,
//             season)
//           VALUES (
//             '${most_gdi}',
//             '${most_gdi_total}',
//             '${most_nod}',
//             '${most_nod_total}',
//             '${most_random}',
//             '${most_random_total}',
//             '${most_overall}',
//             '${most_overall_total}'
//           )`
//         )
//         .then(res => {
//           client.release()
//           return res
//         })
//         .catch(err => {
//           client.release()
//           console.log(err.stack)
//         })
//     })
// }

module.exports = {
  addLeaderboard,
  addMatches,
  addMatchesAsync,
  addTotal,
  addHistory,
  getLatestTotal,
  getAllMatches,
  dropTable,
  createHistory,
  createLeaderboard
};
