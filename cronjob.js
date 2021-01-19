const axios = require('axios').default;
const dotenv = require('dotenv').config();
const DB = require('./utils/dbQueries.js');
const parser = require('./utils/dataFilter.js').dataUploadFilter;

function getCurrentMatchesCount(){
  return axios.get(
    `${process.env.ENDPOINT}`)
    .then(
      (response) => response.data.totalmatches
    ).catch(
      (err) => console.log(err)
    )
}

function FirstScrape(){
  // console.log(`RUNNING FirstScrapes ${Math.floor(limit)}`)
  return axios.get(`${process.env.ENDPOINT}?limit=200`).then(res => parser(res.data)).catch(err => console.log(err))
}

function nScrapes(limit, offset){
  // console.log(`RUNNING nScrapes ${Math.floor(limit)} ${offset}`)
  return axios.get(`${process.env.ENDPOINT}?limit=${Math.floor(limit)}&offset=${offset}`).then(res => parser(res.data)).catch(err => console.log(err))
}

function CronScrape(){
  // logic flow
  let latestTotalMatches = DB.getLatestTotal()
  let currentTotalMatches = getCurrentMatchesCount()

  let difference = Promise.all([currentTotalMatches, latestTotalMatches])
  .then(matches => {
    // need to make sure this is added to db after difference count to prevent race condition
    console.log(`Time: ${Date.now()} LatestDBEntry ${matches[1]}; LatestLiveMatch: ${matches[0]}`)
    DB.addTotal(matches[0])
    let difference = matches[0] - matches[1]
    return difference
  })

  difference.then(difference => {
    const currentDiff = difference
    // some games were being missed from the scraping -> additional offset might duplicate DB entires but should help ensure games aren't missed.
    const offset = 100
    let iterations = (difference + offset) / 200
    while(iterations > 0){
      if (iterations > 1) {
        // modulus gets the post decimal value -> 200*(iterations%1)
        // rather than use iterations lets just go full limit, should help again with overlapped games
        // ceil  gives us the full int value rounded up to prevent any lost overlap
        nScrapes(200, 200*Math.ceil(iterations))
        iterations -= 1
      } else if (iterations <= 1){
        // maxing limit - might be bug stopping us get some matches in the overlap
        FirstScrape()
        iterations = 0
      }
    }
  }).catch(err => console.log(err))
}

// CronScrape()
