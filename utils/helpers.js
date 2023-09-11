function seasonCalculator(date) {
  // Define the start dates for each season as Unix timestamps
  // these are obtainable via the leaderboard list query endpoint
  const seasonStartDates = [
    { season: 14, startDate: 1693522801 }, // September 2023 // 2023-09-01T00:00:01.442857
    { season: 13, startDate: 1685574000 }, // June 2023  // 2023-06-01T00:00:00.29734
    { season: 12, startDate: 1677628799 }, // March 2023 // 2023-02-28T23:59:59.978612

    { season: 11, startDate: 1669852801 }, // December 2022 // 2022-12-01T00:00:01.204621
    { season: 10, startDate: 1661986800 }, // September 2022 // 2022-09-01T00:00:00.134442
    { season: 9, startDate: 1654037999 }, // June 2022 // 2022-05-31T23:59:59.790186
    { season: 8, startDate: 1646092800 }, // March 2022 // 2022-03-01T00:00:00.525261

    { season: 7, startDate: 1638316800 }, // December 2021 // 2021-12-01T00:00:00.475807
    { season: 6, startDate: 1630450799 }, // September 2021 // 2021-08-31T23:59:59.985442
    { season: 5, startDate: 1622502001 }, // June 2021 // 2021-06-01T00:00:01.108728
    { season: 4, startDate: 1615900791 }, // March 2021 // 2021-03-16T13:19:51.430553

    // Pre season-4 logic dicey... needs to be investigated manually...
    { season: 3, startDate: 1609459200 }, // January 2021 // 2020-09-17T12:34:19.147524 2021-03-16T13:19:51.430553
    { season: 2, startDate: 1601510400 }, // October 2020// 2020-08-10T18:13:02.544681 
    { season: 1, startDate: 1593561600 }, // July 2020 // 2020-08-06T17:57:34.788946
  ];

  // Iterate through the start dates to find the current season
  for (const seasonInfo of seasonStartDates) {
    if (date >= seasonInfo.startDate) {
      console.log(`Received value: ${date} and assigning it to season ${seasonInfo.startDate}`)

      return seasonInfo.season;
    }

  }
  console.log(`Received value: ${date} and assigning it to default: ${seasonStartDates[seasonStartDates.length - 1].season}`)

  // Default to the latest season if none of the start dates match
  return seasonStartDates[seasonStartDates.length - 1].season;
}

// official season 3 map names
const ladderMapNames = [
  'MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_1_MAP', // green_acres
  'MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_60_MAP', // monkey_in_the_middle
  'MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_3_MAP', // elevation
  'MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_4_MAP', // heavy_metal
  'MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_5_MAP', // quarry
  'MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_6_MAP', // tournament_middle_camp
  'MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_7_MAP' // tournament_desert
];

// community season 4 map names
const customMapNames = [
  'UGC_01100001000DEC1B_0000000081EBB6A8_MAPDATA', // duality
  'UGC_011000010FDE20F0_000000007E6E4CDA_MAPDATA', // quicksilver
  'UGC_01100001013FFA5D_0000000081DE9C5F_MAPDATA', // neo_twin_peaks
  'UGC_01100001056621FC_0000000082B0CC9F_MAPDATA', // sand_crystal_shard
  'UGC_0110000105329996_000000008064079B_MAPDATA', // higher_order
  'UGC_0110000105329996_000000008289B6E4_MAPDATA', // vales_of_the_templars
  'UGC_0110000105329996_00000000828943E1_MAPDATA', // canyon_paths
  'UGC_01100001013FFA5D_0000000081AC4211_MAPDATA' // frosted_hostilities_vertically_mirrored
];

function ladderMapParserS3(mapname) {
  const ladderMaps = {
    MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_1_MAP: 'green_acres',
    MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_60_MAP: 'monkey_in_the_middle',
    MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_3_MAP: 'elevation',
    MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_4_MAP: 'heavy_metal',
    MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_5_MAP: 'quarry',
    MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_6_MAP: 'tournament_middle_camp',
    MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_7_MAP: 'tournament_desert'
  };

  return ladderMaps[mapname];
}

function ladderMapParserS4(mapname) {
  const ladderMaps = {
    UGC_01100001000DEC1B_0000000081EBB6A8_MAPDATA: 'duality',
    UGC_011000010FDE20F0_000000007E6E4CDA_MAPDATA: 'quicksilver',
    UGC_01100001013FFA5D_0000000081DE9C5F_MAPDATA: 'neo_twin_peaks',
    UGC_01100001056621FC_0000000082B0CC9F_MAPDATA: 'sand_crystal_shard',
    UGC_0110000105329996_000000008064079B_MAPDATA: 'higher_order',
    UGC_0110000105329996_000000008289B6E4_MAPDATA: 'vales_of_the_templars',
    UGC_0110000105329996_00000000828943E1_MAPDATA: 'canyon_paths',
    UGC_01100001013FFA5D_0000000081AC4211_MAPDATA:
      'frosted_hostilities_vertically_mirrored'
  };

  return ladderMaps[mapname];
}

module.exports = {
  customMapNames,
  ladderMapNames,
  seasonCalculator,
  ladderMapParserS3,
  ladderMapParserS4
};
