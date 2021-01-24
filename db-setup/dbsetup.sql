\c cnc-matches

-- for tracking all match data - may contain duplicates
CREATE TABLE matches(
  index serial,
  starttime FLOAT NOT NULL,
  match_duration FLOAT NOT NULL,
  player1_id BIGINT,
  player1_name varchar(255) NOT NULL,
  player1_faction varchar(3) NOT NULL,
  player1_random BOOLEAN,
  player2_id BIGINT,
  player2_name varchar(255) NOT NULL,
  player2_faction varchar(3) NOT NULL,
  player2_random BOOLEAN,
  result varchar(255) NOT NULL,
  map varchar(255) NOT NULL,
  replay varchar(255) NOT NULL,
  season INT NOT NULL
);

-- for tracking cronjob progress via match totals
CREATE TABLE totals(
  index serial,
  date_inserted timestamp NOT NULL DEFAULT NOW(),
  total INT NOT NULL
);

-- for quick access to leaderboard
CREATE TABLE leaderboard(
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
);

-- for quick access to specific players match history
CREATE TABLE elo_history(
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
);

-- for quick access to awarded players
-- CREATE TABLE awards(
--   index serial,
--   most_gdi varchar(255),
--   most_gdi_total INT,
--   most_nod varchar(255),
--   most_nod_total INT,
--   most_random varchar(255),
--   most_random_total INT,
--   most_overall varchar(255),
--   most_overall_total INT,
--   season INT
-- )
