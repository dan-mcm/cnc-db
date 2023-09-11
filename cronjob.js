const axios = require('axios').default;
const dotenv = require('dotenv').config();
const DB = require('./utils/dbQueries.js');
const { dataUploadFilter } = require('./utils/dataFilter.js');
const { regenerateEloTables } = require('./utils/elo.js');

if (!process.env.ENDPOINT || process.env.ENDPOINT.trim() === '') {
  console.error('ENDPOINT is undefined or blank. Exiting script.');
  process.exit(1);
}

function getCurrentMatchesCount() {
  return axios
    .get(`${process.env.ENDPOINT}`)
    .then((response) => response.data.totalmatches)
    .catch((err) => console.log(err));
}

function FirstScrape(pool) {
  // console.log(`RUNNING FirstScrapes ${Math.floor(limit)}`)
  return axios
    .get(`${process.env.ENDPOINT}?limit=200`)
    .then((res) => dataUploadFilter(pool, res.data))
    .then(() => console.log('Match Table Update Complete.'))
    .catch((err) => console.log(err));
}

function nScrapes(pool, limit, offset) {
  // console.log(`RUNNING nScrapes ${Math.floor(limit)} ${offset}`)
  return axios
    .get(`${process.env.ENDPOINT}?limit=${Math.floor(limit)}&offset=${offset}`)
    .then((res) => dataUploadFilter(pool, res.data))
    .catch((err) => console.log(err));
}

async function updateMatchesTable(pool) {
  try {
    const [currentTotalMatches, latestTotalMatches] = await Promise.all([
      getCurrentMatchesCount(),
      DB.getLatestTotal(pool),
    ]);

    const difference = currentTotalMatches - latestTotalMatches;

    console.log(
      `Time: ${Date.now()} LatestDBEntry ${latestTotalMatches}; LatestLiveMatch: ${currentTotalMatches}`
    );

    // Add the current total matches to the database
    await DB.addTotal(pool, currentTotalMatches);

    if (difference > 0) {
      // Calculate how many iterations are needed
      const offset = 100;
      const iterations = Math.ceil((difference + offset) / 200);

      // Perform the scraping iterations
      for (let i = 0; i < iterations; i++) {
        const limit = 200 * (i + 1); // Adjust the limit based on the iteration
        await nScrapes(pool, 200, limit);
      }
    } else {
      console.log('No new matches to scrape.');
    }
  } catch (err) {
    console.error(err);
  }
}


// function updateMatchesTable(pool) {
//   // get difference between offset of last scrape and current call
//   const latestTotalMatches = DB.getLatestTotal(pool);
//   const currentTotalMatches = getCurrentMatchesCount();
//   const difference = Promise.all([currentTotalMatches, latestTotalMatches])
//     .then((matches) => {
//       // need to make sure this is added to db after difference count to prevent race condition
//       console.log(
//         `Time: ${Date.now()} LatestDBEntry ${matches[1]}; LatestLiveMatch: ${
//           matches[0]
//         }`
//       );
//       DB.addTotal(pool, matches[0]);
//       const difference = matches[0] - matches[1];
//       return difference;
//     })
//     .catch((err) => {
//       console.log(`${err}`);
//     });

//   // use offset difference to determine how much to crawl this time
//   return difference.then((difference) => {
//     // some games were being missed from the scraping -> additional offset might duplicate DB entires but should help ensure games aren't missed.
//     const offset = 100;
//     let iterations = (difference + offset) / 200;
//     while (iterations > 0) {
//       if (iterations > 1) {
//         // modulus gets the post decimal value -> 200*(iterations%1)
//         // rather than use iterations lets just go full limit, should help again with overlapped games
//         // ceil  gives us the full int value rounded up to prevent any lost overlap
//         nScrapes(pool, 200, 200 * Math.ceil(iterations));
//         iterations -= 1;
//       } else if (iterations <= 1) {
//         // maxing limit - might be bug stopping us get some matches in the overlap
//         iterations = 0;
//         return FirstScrape(pool);
//       }
//     }
//   });
// }

// function CronScrape() {
//   console.log(`Starting Cronjob...`);
//   const pool = DB.createPool(); // create pool
//   // Promise.all([updateMatchesTable(pool), regenerateEloTables(pool)])

//   updateMatchesTable(pool) // phase 1 -> Handle our general matches table update
//     .then((res) => {
//       regenerateEloTables(pool); // phase 2 -> handle our elo table generation
//     })
//     .catch((err) => console.log(err));
// }

// CronScrape();

function eloCalc(){
  console.log(`Starting eloCalc...`);
  regenerateEloTables()
}

eloCalc()