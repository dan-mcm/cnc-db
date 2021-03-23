const DB = require('./dbQueries.js');
const dotenv = require('dotenv').config();
const { seasonCalculator } = require('./helpers.js');
const { ladderMapNames } = require('./helpers.js');
const { customMapNames } = require('./helpers.js');
const { ladderMapParserS3 } = require('./helpers.js');
const { ladderMapParserS4 } = require('./helpers.js');
// const { sampleData } = require('../test-data/singleObject.js');
// const { data } = require('../test-data/2215to2323.js');

function dataUploadFilter(pool, apiMatches) {
  // console.log(`ENTERED DATA UPLOAD FILTER`)
  apiMatches.matches.map((singleMatch) => {
    // standard quickmatch maps = season 3 onwards
    // if game is TD && starttime > 1/1/21 && mapname matches approved maps && num players = 2 && its a QM game
    if (
      singleMatch.extramatchsettings &&
      singleMatch.extramatchsettings.product_type === 'TD' &&
      // 1st Jan 2021
      singleMatch.starttime > 1609459200 &&
      singleMatch.names.length === 2 &&
      singleMatch.matchname === '1v1 QM' &&
      ladderMapNames.some((map) => singleMatch.mapname.includes(map))
    ) {
      // console.log(Object.keys(singleMatch))
      const { starttime } = singleMatch;
      const matchDuration  = singleMatch.matchduration;
      const player1TeamID = singleMatch.players[0];
      const player1Name = singleMatch.names[0];
      const player1TeamName = singleMatch.teams[0];
      const player1Faction = singleMatch.factions[0] === 0 ? 'GDI' : 'Nod';
      const player1Random = singleMatch.wasrandom[0] ? 1 : 0;

      const player2TeamID = singleMatch.players[1];
      const player2Name = singleMatch.names[1];
      // const player2TeamName = singleMatch.teams[1];
      const player2Faction = singleMatch.factions[1] === 0 ? 'GDI' : 'Nod';
      const player2Random = singleMatch.wasrandom[1] ? 1 : 0;

      const winningTeamID = singleMatch.winningteamid;

      const result =
        winningTeamID === player1TeamName ? player1Name : player2Name;

      const map = ladderMapParserS3(singleMatch.mapname); // converting to human readable
      const replay = singleMatch.cdnurl;

      // 2021 Season Resets
      const season = seasonCalculator(singleMatch.starttime);

      // console.log(`DEBUGGING VALUES ${starttime} ${matchDuration}, ${player1Name}, ${player2Name}, ${player2Faction}, ${result}, ${map}, ${replay}, ${season}`)
      DB.addMatches(
        pool,
        starttime,
        matchDuration,
        player1TeamID,
        player1Name,
        player1Faction,
        player1Random,
        player2TeamID,
        player2Name,
        player2Faction,
        player2Random,
        result,
        map,
        replay,
        season
      );
    }

    // season 4
    // if game is TD && starttime > 1/1/21 && mapname matches approved maps && num players = 2
    if (
      singleMatch.extramatchsettings &&
      singleMatch.extramatchsettings.product_type === 'TD' &&
      // 1st Jan 2021
      singleMatch.starttime > 1609459200 &&
      singleMatch.names.length === 2 &&
      customMapNames.some((map) => singleMatch.mapname.includes(map))
    ) {
      //console.log(Object.keys(singleMatch))
      const { starttime } = singleMatch;
      const matchDuration = singleMatch.matchduration;
      const player1Name = singleMatch.names[0];

      const player1TeamName = singleMatch.teams[0];
      const player2TeamName = singleMatch.teams[1];

      const player1TeamID = singleMatch.players[0];
      const player2TeamID = singleMatch.players[1];

      const player1Faction =
        singleMatch.factions[player1TeamName] === 0 ? 'GDI' : 'Nod';
      const player1Random = singleMatch.wasrandom[player1TeamName] ? 1 : 0;

      const player2Name = singleMatch.names[1];
      const player2Faction =
        singleMatch.factions[player2TeamName] === 0 ? 'GDI' : 'Nod';
      const player2Random = singleMatch.wasrandom[player2TeamName] ? 1 : 0;

      const winningTeamID = singleMatch.winningteamid;

      const result =
        winningTeamID === player1TeamName ? player1Name : player2Name;

      const map = ladderMapParserS4(singleMatch.mapname); // converting to human readable
      const replay = singleMatch.cdnurl;
      const season = 4; //hardcoded
      // console.log(`DEBUGGING VALUES ${starttime} ${matchDuration}, ${player1Name}, ${player2Name}, ${player2Faction}, ${result}, ${map}, ${replay}, ${season}`)
      DB.addMatches(
        pool,
        starttime,
        matchDuration,
        player1TeamID,
        player1Name,
        player1Faction,
        player1Random,
        player2TeamID,
        player2Name,
        player2Faction,
        player2Random,
        result,
        map,
        replay,
        season
      );
    }
  });
}

module.exports = {
  dataUploadFilter
};
