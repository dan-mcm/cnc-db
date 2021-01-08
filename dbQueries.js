// see https://github.com/dan-mcm/rate-my-therapist/blob/master/server/dbQueries.js as useful reference

const { Pool } = require('pg');
// eslint-disable-next-line no-unused-vars
const dotenv = require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const getAllMatches = async function() {
  const selectAll = {
    name: 'fetch-matches',
    text: 'SELECT * FROM matches'
  };

  const res = await pool.query(selectAll, (err, res) => {
    if (err) {
      console.log(err.stack);
    } else {
      // console.log(res.rows);
      return res.rows;
    }
    // Syntax used to hide error logging of pool end > once
    // pool.end(() => {});
  });

  return res;
};

const addMatches = async function(starttime, matchDuration, player1Name, player1Faction, player2Name, player2Faction, result, map, replay, season) {
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

// need to add custom logic in here
const filteringDataForFrontend = function(data) {
  // // Based on length of the reviews array, each review = 1 object
  // const total_reviews = data.length;
  //
  // // Underlying logic assumes consistent data across all entries for these values
  // const { therapist_name, type, image, location, contact } = data[0];
  //
  // // Summing the rating values across multiple review entries
  // const ratings = data.reduce((acc, obj) => ({
  //   rating_friendliness: acc.rating_friendliness + obj.rating_friendliness,
  //   rating_techniques: acc.rating_techniques + obj.rating_techniques,
  //   rating_progression: acc.rating_progression + obj.rating_progression,
  //   rating_cost: acc.rating_progression + obj.rating_progression,
  //   rating_listening: acc.rating_listening + obj.rating_listening,
  //   rating_overall: acc.rating_overall + obj.rating_overall
  // }));
  //
  // const feedback_comments = data.reduce(function(total, value) {
  //   return total.concat(value.feedback_comments);
  // }, []);
  //
  // // Filtered data for returning
  // const filteredData = {
  //   therapist_name,
  //   type,
  //   image,
  //   location,
  //   total_reviews,
  //   contact,
  //   feedback_comments,
  //   rating_friendliness: ratings.rating_friendliness / total_reviews,
  //   rating_techniques: ratings.rating_techniques / total_reviews,
  //   rating_progression: ratings.rating_progression / total_reviews,
  //   rating_cost: ratings.rating_cost / total_reviews,
  //   rating_listening: ratings.rating_listening / total_reviews,
  //   rating_overall: ratings.rating_overall / total_reviews
  // };
  // /* eslint-enable camelcase */
  //
  // // DEBUG console.log(`\n DEBUG 1 - filteredData -> ${JSON.stringify(filteredData)} \n`)
  // return filteredData;
};

const getSpecificPlayersMatches = async function(playerName) {
  // DEBUG console.log(`Fetching reviews for: ${therapist_name}.`)

  const getSpecificPlayersMatches = {
    name: `${playerName}-matches`,
    text: `SELECT * FROM matches WHERE player1_name LIKE '%${playerName}% OR player2_name LIKE '%${playerName}'`
  };

  /* eslint-enable camelcase */

  const res = await new Promise(resolve => {
    pool.query(getSpecificPlayersMatches, (err, res) => {
      let data = [];
      if (err) {
        console.log(err.stack);
      } else {
        // DEBUG console.log(res.rows);
        data = filteringDataForFrontend(res.rows);
      }

      // DEBUG console.log(`\n DEBUG2 - GetSpecificTherapistReviews ${JSON.stringify(data)} \n`)
      resolve(data);
    });
  });
  return res;
};


const getFormattedMatches = async function() {
  const getDistinct = {
    name: 'distinct-reviews',
    text: 'SELECT DISTINCT name FROM matches'
  };

  const res = await new Promise(resolve => {
    pool.query(getDistinct, (err, res) => {
      let data = [];
      if (err) {
        console.log(err.stack);
      } else {
        // DEBUG console.log(res.rows);
        data = res.rows.map(async match =>
          getSpecificPlayersMatches(match.name)
        );
        // Promise.all(data).then(results => console.log(`\n DEBUG3 - getFormattedReviews data: ${JSON.stringify(results)} \n`))
      }

      Promise.all(data).then(results => resolve(results));
    });
  });
  return res;
};

module.exports = {
  addMatches,
  getAllMatches,
  getFormattedMatches
};
