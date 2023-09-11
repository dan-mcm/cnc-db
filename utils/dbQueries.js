const { Pool} = require('pg');
const dotenv = require('dotenv').config();

// let pool = createPool()
let addMatchCounterSuccess = 0;
let addMatchCounterFailure = 0;

function createPool() {
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
    console.error('Unexpected error on idle client', err);
    console.log('createPool() Error.')
    process.exit(-1);
  });

  return pool;
}

function getAllMatches(pool) {
  return pool.connect().then((client) => {
    return client
      .query('SELECT * FROM matches')
      .then((res) => {
        client.release();
        return res.rows;
      })
      .catch((err) => {
        client.release();
        console.log('getAllMatches() Error.')
        console.log(err.stack);
      });
  });
}

function getSpecificSeasonMatches(pool, season, limit) {
  return pool.connect().then((client) => {
    return client
      .query(
        `SELECT distinct(starttime) starttime, match_duration, player1_name, player1_faction, player1_random, player2_name, player2_faction, player2_random, result, map, replay, season FROM matches WHERE season=${season} and starttime>${limit} order by starttime ASC`
      )
      .then((res) => {
        client.release();
        return res.rows;
      })
      .catch((err) => {
        client.release();
        console.log('getSpecificSeasonMatches() Error.')
        console.log(err.stack);
      });
  });
}

function getLatestTotal(pool) {
  console.log(`Fetching Latest Total...`)
  return pool.connect().then((client) => {
    return client
      .query('SELECT total FROM totals ORDER BY date_inserted DESC LIMIT 1')
      .then((res) => {
        client.release();
        const latestTotal = res.rows[0]?.total || 0; // Using optional chaining and providing a default value
        console.log(`Found latest total value of: ${latestTotal}`)
        return latestTotal;
      })
      .catch((err) => {
        try {
          client.release();
        } catch (error) {
          console.log('getLatestTotal() Error.')
          console.error('Error releasing client:', error);
        }
        console.log(err.stack);
      });
  });
}

function addLeaderboard(
  pool,
  player_name,
  season,
  rank,
  position,
  points,
  wins,
  loses,
  played,
  winrate
) {
  return pool.connect().then((client) => {
    const query = {
      text: `INSERT INTO leaderboard (player_name, season, rank, position, points, wins, loses, played, winrate)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      values: [
        player_name,
        season,
        rank,
        position,
        points,
        wins,
        loses,
        played,
        winrate
      ],
    };
    return client
      .query(query)
      .then((res) => {
        client.release();
        return res;
      })
      .catch((err) => {
        client.release();
        console.log('addLeaderboard() Error.')
        console.log(err.stack);
      });
  });
}

function overridePlayersLeaderboardPosition(
  pool,
  current_index,
  player_name,
  season,
  rank,
  position,
  points,
  wins,
  loses,
  played,
  winrate
) {
  // console.log(
  //   `UPDATE leaderboard SET player_name='${player_name}', season='${season}', rank='${rank}', position='${position}', points='${points}', wins='${wins}', loses='${loses}', played='${played}', winrate='${winrate}' WHERE index=${current_index} and season=${season}`
  // );
  return pool.connect().then((client) => {
    return client
      .query(
        `UPDATE leaderboard SET player_name='${player_name}', season='${season}', rank='${rank}', position='${position}', points='${points}', wins='${wins}', loses='${loses}', played='${played}', winrate='${winrate}' WHERE index=${current_index} and season=${season}`
      )
      .then((res) => {
        client.release();
        return res;
      })
      .catch((err) => {
        client.release();
        console.log('overridePlayersleaderboardPosition() Error.')
        console.log(err.stack);
      });
  });
}

function getPlayersCurrentLeaderboardIndex(pool, name, season) {
  return pool.connect().then((client) => {
    return client
      .query(
        `SELECT index FROM leaderboard WHERE player_name='${name}' AND season=${season}`
      )
      .then((res) => {
        client.release();
        // if we have a matched index return it
        if (res.rows[0] !== undefined) return res.rows[0].index;
        // else return 0
        return 0;
      })
      .catch((err) => {
        client.release();
        console.log('getPlayersCurrentLeaderboardIndex() Error.')
        console.log(err.stack);
      });
  });
}

function getExistingSeasonEloMatches(pool, season) {
  return pool.connect().then((client) => {
    return client
      .query(`SELECT * FROM elo_history WHERE season='${season}'`)
      .then((res) => {
        client.release();
        return res.rows;
      })
      .catch((err) => {
        client.release();
        console.log('getExistingSeasonEloMatches() Error.')
        console.log(err.stack);
      });
  });
}

function addMatches(
  pool,
  starttime,
  matchDuration,
  player1_id,
  player1Name,
  player1Faction,
  player1Random,
  player2_id,
  player2Name,
  player2Faction,
  player2Random,
  result,
  map,
  replay,
  season
) {
  const query = {
    text: `INSERT INTO matches (starttime, match_duration, player1_id, player1_name, player1_faction, player1_random, player2_id, player2_name, player2_faction, player2_random, result, map, replay, season)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    values: [
      starttime,
      matchDuration,
      player1_id,
      player1Name,
      player1Faction,
      player1Random,
      player2_id,
      player2Name,
      player2Faction,
      player2Random,
      result,
      map,
      replay,
      season,
    ],
  };

  return pool.connect().then((client) => {
    return client
      .query(query)
      .then((res) => {
        addMatchCounterSuccess += 1
        console.log(`successful addMatch write - count ${addMatchCounterSuccess}`)
        client.release();
        return res;
      })
      .catch((err) => {
        addMatchCounterFailure += 1;
        console.log(`failed write count - count ${addMatchCounterSuccess}`)

        client.release();
        console.log('addMatches() Error.')
        console.log(err.stack);
      });
  });
}

// const addMatchesAsync = async function(starttime, matchDuration, player1_id, player1Name, player1Faction, player1Random, player2_id, player2Name, player2Faction, player2Random, result, map, replay, season) {
//   const client = await pool.connect()
//   try{
//     const res = await pool.query(
//       `INSERT INTO matches (starttime, match_duration, player1_id, player1_name, player1_faction, player1_random, player2_id, player2_name, player2_faction, player2_random, result, map, replay, season)
//       VALUES ('${starttime}', '${matchDuration}', '${player1_id}', '${player1Name}', '${player1Faction}', '${player1Random}', '${player2_id}', '${player2Name}', '${player2Faction}', '${player2Random}', '${result}', '${map}', '${replay}', '${season}')`,
//       (err, res) => {
//         if (err) {
//           console.log(err);
//         } else {
//           console.log(res);
//           return res;
//         }
//       }
//     );
//     console.log(`SUCCESS!!! ${res}`)
//   } finally {
//     client.release()
//   }
// };

// 1,400,000 default 1400000
function addTotal(pool, total) {
  return pool.connect().then((client) => {
    return client
      .query(`INSERT INTO totals (total) VALUES ('${total}')`)
      .then((res) => {
        client.release();
        return res;
      })
      .catch((err) => {
        client.release();
        console.log('addTotal() Error.')
        console.log(err.stack);
      });
  });
}

function dropTable(pool, table) {
  return pool.connect().then((client) => {
    return client
      .query(`DROP TABLE ${table}`)
      .then((res) => {
        client.release();
        return res;
      })
      .catch((err) => {
        client.release();
        console.log(err.stack);
      });
  });
}

function createLeaderboard(pool) {
  return pool.connect().then((client) => {
    return client
      .query(
        `CREATE TABLE leaderboard(
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
        )`
      )
      .then((res) => {
        client.release();
        return res;
      })
      .catch((err) => {
        console.log(err.stack);
        client.release();
      });
  });
}

function createHistory(pool) {
  return pool.connect().then((client) => {
    return client
      .query(
        `CREATE TABLE elo_history(
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
        )`
      )
      .then((res) => {
        client.release();
        return res;
      })
      .catch((err) => {
        console.log(err.stack);
        client.release();
      });
  });
}

function addHistory(
  pool,
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
) {
  console.log(
    `Inserting into elo_history:
    - pool: ${pool}
    - starttime: ${starttime}
    - matchDuration: ${matchDuration}
    - playerName: ${playerName}
    - playerFaction: ${playerFaction}
    - playerRandom: ${playerRandom}
    - playerExistingElo: ${playerExistingElo}
    - playerNewElo: ${playerNewElo}
    - opponentName: ${opponentName}
    - opponentFaction: ${opponentFaction}
    - opponentRandom: ${opponentRandom}
    - opponentExistingElo: ${opponentExistingElo}
    - opponentNewElo: ${opponentNewElo}
    - map: ${map}
    - replay: ${replay}
    - result: ${result}
    - season: ${season}`
  );

  return pool.connect().then((client) => {

    const query = {
      text: `INSERT INTO elo_history (
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      values: [
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
      ],
    };

    return client
      .query(query)
      .then((res) => {
        console.log('addHistory() Success')
        return res;
      })
      .catch((err) => {
        console.log('addHistory() Error.')
        console.log(err.stack);
      })
  });
}

function closePool(pool) {
  return pool.end().then(() => console.log('Closed PG Pool'));
}

module.exports = {
  addLeaderboard,
  addMatches,
  addTotal,
  addHistory,
  getLatestTotal,
  getAllMatches,
  dropTable,
  createHistory,
  createLeaderboard,
  createPool,
  closePool,
  getPlayersCurrentLeaderboardIndex,
  getSpecificSeasonMatches,
  getExistingSeasonEloMatches,
  overridePlayersLeaderboardPosition
};
