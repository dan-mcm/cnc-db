const { Pool } = require('pg');
const dotenv = require('dotenv').config();

const connectionString = `${process.env.DBSTRING}`
// for local...
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT
// });
//for prod...
const pool = new Pool({
  connectionString: process.env.DBSTRING,
  ssl: {
    rejectUnauthorized: false
  }
});

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
          client.release()
          console.log(err.stack)
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
          client.release()
          console.log(err.stack)
        })
    })
}

function addMatches(starttime, matchDuration, player1Name, player1Faction, player2Name, player2Faction, result, map, replay, season) {
  return pool
    .connect()
    .then(client => {
      return client
        .query(
          `INSERT INTO matches (starttime, match_duration, player1_name, player1_faction, player2_name, player2_faction, result, map, replay, season)
          VALUES ('${starttime}', '${matchDuration}', '${player1Name}', '${player1Faction}', '${player2Name}', '${player2Faction}', '${result}', '${map}', '${replay}', '${season}')`
        )
        .then(res => {
          client.release()
          return res
        })
        .catch(err => {
          client.release()
          console.log(err.stack)
        })
    })
};

const addMatchesAsync = async function(starttime, matchDuration, player1Name, player1Faction, player2Name, player2Faction, result, map, replay, season) {
  const res = await pool.query(
    `INSERT INTO matches (starttime, match_duration, player1_name, player1_faction, player2_name, player2_faction, result, map, replay, season)
    VALUES ('${starttime}', '${matchDuration}', '${player1Name}', '${player1Faction}', '${player2Name}', '${player2Faction}', '${result}', '${map}', '${replay}', '${season}')`,
    (err, res) => {
      if (err) {
        console.log(err);
      } else {
        console.log(res);
      }

      // Syntax used to hide error logging of pool end > once
      // pool.end(() => {});
    }
  );
  return res;
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
          client.release()
          console.log(err.stack)
        })
    })
};

module.exports = {
  addMatches,
  addMatchesAsync,
  addTotal,
  getLatestTotal,
  getAllMatches
};
