// assumption that starttime is greater than jan 1st 2021 by default
function seasonCalculator(starttime) {
  // 2021 months
  // const jan = 1609459200;
  const apr = 1617235200;
  const july = 1625097600;
  const oct = 1633046400;
  // 2022 months
  const jan2 = 1640995200;

  if (starttime < apr) return 3;
  // skipping 4 as used for our custom-map season
  if (starttime < july) return 5;
  if (starttime < oct) return 6;
  if (starttime < jan2) return 7;
  // placeholder defaulting to season 8
  if (starttime > jan2) return 8;
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
