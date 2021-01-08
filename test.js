const DB = require('./dbQueries.js');
const dotenv = require('dotenv').config();
const sampleData = require('./singleObject.js').sampleData
// const groupData = require('./multipleObject.js').largerData

function testPut(){
  DB.addMatches(1610040909, 98.768987, 'Danku', 'GDI', 'KHANOMANCER', 'Nod', 'Danku', 'monkey_in_the_middle', 'MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_1_MAP.745903.1482737.1609444814.0.36.Replay', 4)
}

const testGetAll = async () => {
  const data = await DB.getAllMatches()
  return data
}
// promise - logs results within
// const results = testGetAll()


// console.log(`DATA: ${JSON.stringify(sampleData)}`)

// sampleData[0] is representative of array of similar results, key functions can be mapped later...
// console.log(Object.keys(sampleData[0].matches))
// let matches = sampleData[0].matches

// official season 3 map names
let ladderMapNames = [
  "MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_1_MAP", // green_acres
  "MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_60_MAP", // monkey_in_the_middle
  "MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_3_MAP", // elevation
  "MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_4_MAP", // heavy_metal
  "MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_5_MAP", // quarry
  "MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_6_MAP", // tournament_middle_camp
  "MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_7_MAP" // tournament_desert
]

// community season 4 map names
let customMapNames = [
  "UGC_01100001000DEC1B_0000000081EBB6A8_MAPDATA", // duality
  "UGC_011000010FDE20F0_000000007E6E4CDA_MAPDATA", // quicksilver
  "UGC_01100001013FFA5D_0000000081DE9C5F_MAPDATA", // neo_twin_peaks
  "UGC_01100001056621FC_0000000082B0CC9F_MAPDATA", // sand_crystal_shard
  "UGC_0110000105329996_000000008064079B_MAPDATA", // higher_order
  "UGC_0110000105329996_000000008289B6E4_MAPDATA", // vales_of_the_templars
  "UGC_0110000105329996_00000000828943E1_MAPDATA", // canyon_paths
  "UGC_01100001013FFA5D_0000000081AC4211_MAPDATA" // frosted_hostilities_vertically_mirrored
]

function ladderMapParserS3(mapname){
  let ladderMaps = {
    "MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_1_MAP": "green_acres",
    "MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_60_MAP": "monkey_in_the_middle",
    "MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_3_MAP": "elevation",
    "MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_4_MAP": "heavy_metal",
    "MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_5_MAP": "quarry",
    "MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_6_MAP": "tournament_middle_camp",
    "MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_7_MAP": "tournament_desert"
  }

  return ladderMaps[mapname]
}

function ladderMapParserS4(mapname){
  let ladderMaps = {
    "UGC_01100001000DEC1B_0000000081EBB6A8_MAPDATA": "duality",
    "UGC_011000010FDE20F0_000000007E6E4CDA_MAPDATA": "quicksilver",
    "UGC_01100001013FFA5D_0000000081DE9C5F_MAPDATA": "neo_twin_peaks",
    "UGC_01100001056621FC_0000000082B0CC9F_MAPDATA": "sand_crystal_shard",
    "UGC_0110000105329996_000000008064079B_MAPDATA": "higher_order",
    "UGC_0110000105329996_000000008289B6E4_MAPDATA": "vales_of_the_templars",
    "UGC_0110000105329996_00000000828943E1_MAPDATA": "canyon_paths",
    "UGC_01100001013FFA5D_0000000081AC4211_MAPDATA": "frosted_hostilities_vertically_mirrored"
  }
}

function dataUploadFilter(apiMatches){
  apiMatches.map(matches =>
    matches.matches.map(singleMatch => {

      // season 3
      // if game is TD && starttime > 1/1/21 && mapname matches approved maps && num players = 2
      // console.log(`EXTRA MATCH SETTINGS: ${JSON.stringify(singleMatch.extramatchsettings)}`)
      if (singleMatch.extramatchsettings
      && singleMatch.extramatchsettings.product_type === 'TD'
      && singleMatch.starttime > 1609459200
      && singleMatch.names.length === 2
      && ladderMapNames.some(map => singleMatch.mapname.includes(map))){
        // console.log(Object.keys(singleMatch))
        let starttime = singleMatch.starttime
        let matchDuration = singleMatch.matchduration
        let player1Name = unescape(singleMatch.names[0])
        let player1Faction = (singleMatch.factions[0] === 0) ? "GDI" : "Nod"
        let player2Name = unescape(singleMatch.names[1])
        let player2Faction = (singleMatch.factions[1] === 0) ? "GDI" : "Nod"
        let result = singleMatch.names[singleMatch.winningteamid]
        let map = ladderMapParserS3(singleMatch.mapname) // converting to human readable
        let replay = singleMatch.cdnurl
        let season = 3 //hardcoded
        DB.addMatches(
          starttime,
          matchDuration,
          player1Name,
          player1Faction,
          player2Name,
          player2Faction,
          result,
          map,
          replay,
          season
        )
      }

      // season 4
      // if game is TD && starttime > 1/1/21 && mapname matches approved maps && num players = 2
      if (singleMatch.extramatchsettings
      && singleMatch.extramatchsettings.product_type === 'TD'
      && singleMatch.starttime > 1609459200
      && singleMatch.names.length === 2
      && customMapNames.some(map => singleMatch.mapname.includes(map))){
        //console.log(Object.keys(singleMatch))
        let starttime = singleMatch.starttime
        let matchDuration = singleMatch.matchduration
        let player1Name = unescape(singleMatch.names[0])
        let player1Faction = (singleMatch.factions[0] && singleMatch.factions[0] === 0) ? "GDI" : "Nod"
        let player2Name = unescape(singleMatch.names[1])
        let player2Faction = (singleMatch.factions[1] && singleMatch.factions[1] === 0) ? "GDI" : "Nod"
        let result = singleMatch.names[singleMatch.winningteamid]
        let map = ladderMapParserS4(singleMatch.mapname) // converting to human readable
        let replay = singleMatch.cdnurl
        let season = 4 //hardcoded
        DB.addMatches(
          starttime,
          matchDuration,
          player1Name,
          player1Faction,
          player2Name,
          player2Faction,
          result,
          map,
          replay,
          season
        )
      }
    }
  )
)
}


// try with group data... our sample data only has RA data smh...
dataUploadFilter(sampleData)

module.exports = {
  dataUploadFilter
};
