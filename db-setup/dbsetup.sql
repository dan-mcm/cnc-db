\c cnc-matches

CREATE TABLE matches(
  index serial,
  starttime FLOAT NOT NULL,
  match_duration FLOAT NOT NULL,
  player1_name varchar(255) NOT NULL,
  player1_faction varchar(3) NOT NULL,
  player2_name varchar(255) NOT NULL,
  player2_faction varchar(3) NOT NULL,
  result varchar(255) NOT NULL,
  map varchar(255) NOT NULL,
  replay varchar(255) NOT NULL,
  season INT NOT NULL
);

CREATE TABLE totals(
  index serial,
  date_inserted timestamp NOT NULL DEFAULT NOW(),
  total INT NOT NULL
)
