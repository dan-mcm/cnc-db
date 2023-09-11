const { parentPort, workerData } = require('worker_threads');
const DB = require('./dbQueries.js');
const ELO = require('./elo.js')

async function eloUpdateWorker() {
    const season = workerData;
    let client;

    try {
      const pool = DB.createPool();
      client = await pool.connect();
      await ELO.eloUpdate(pool, season, client);
      parentPort.postMessage(`Elo update for season ${season} completed.`);
    } catch (error) {
      console.error(`Error in eloUpdateWorker: ${error}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

eloUpdateWorker();
