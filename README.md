# CNC Community Ladder - Database

[![code style: prettier](https://img.shields.io/badge/style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![XO code linter](https://img.shields.io/badge/linter-XO-5ed9c7.svg)](https://github.com/xojs/xo)

<center>
<img width= "400" height="200" src="https://raw.githubusercontent.com/dan-mcm/cnc-community-ladder/main/src/images/cnc_remastered.png"/>
</center>  
<br/>

Used to bootstrap connections to Petroglyph/EA API and dump into a DB.
Also includes docker-compose for bootstrapping a local database.  

.env file is used for storing DB connection details as well as API endpoint.

See frontend application [here](https://github.com/dan-mcm/cnc-community-ladder).

## Running Script

```
# runs main cronjob
yarn cron

# runs prettier
yarn pretty

# runs linter
yarn lint
```

## Table Schema

The following is an overview of the tables setup for use with this DB.
You may wish to enable UTF 8 encoding with `SET client_encoding TO 'UTF8';`

### **matches** table

Used for storing individual match data between players.

| index | starttime         | match_duration | player1_id        | player1_name | player1_faction | player1_random | player2_id    | player2_name | player2_faction | player2_random | result     | map               | replay                                                                                 | season |
| :---- | :---------------- | :------------- | :---------------- | :----------- | :-------------- | :------------- | :------------ | :----------- | :-------------- | :------------- | :--------- | :---------------- | :------------------------------------------------------------------------------------- | :----- |
| 8581  | 1610929378.788002 | 544.160959     | 76561199124368940 | jon          | GDI             | f              | 1008404381514 | JxDHarrell   | GDI             | f              | JxDHarrell | tournament_desert | MOBIUS_TIBERIAN_DAWN_MULTIPLAYER_COMMUNITY_7_MAP.745903.1577313.1610929385.0.36.Replay | 3      |

### **totals** table

Used for keeping track of value for total games recorded by the API. This is used for offsetting the cronjob scraping.

| index | date_inserted              | total   |
| :---- | :------------------------- | :------ |
| 453   | 2021-01-18 00:51:35.856808 | 1460165 |

### **leaderboard** table

Used for keep our top players data - easier for the frontend to parse

| index | player_name     | season | rank    | position | points | wins | loses | played | winrate |
| ----- | --------------- | ------ | ------- | -------- | ------ | ---- | ----- | ------ | ------- |
| 1     | patrickschenkel | 4      | general | 6        | 984    | 0    | 1     | 1      | 0       |

### **elo_history** table

Used for keeping a record of all the elo changes on a per match bais, less compute intensive on frontend to do this here.

| index | starttime        | duration   | player                        | player_faction | player_random | player_existing_elo | player_new_elo | opponent | opponent_faction | opponent_random | opponent_existing_elo | opponent_new_elo | map          | replay                                                                                                             | result | season |
| ----- | ---------------- | ---------- | ----------------------------- | -------------- | ------------- | ------------------- | -------------- | -------- | ---------------- | --------------- | --------------------- | ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------ | ------ | ------ |
| 1     | 1610052168.61669 | 312.427709 | myName="sir smart harvester"; | Nod            | t             | 1000                | 1016           | MC RusTy | GDI              | t               | 1000                  | 984              | canyon_paths | https://replays.cnctdra.ea.com/UGC_0110000105329996_00000000828943E1_MAPDATA.745903.1522834.1610052186.0.36.Replay | f      | 4      |

## DB Production - Heroku Setup

Useful Commands

```
heroku login
heroku pg:info -a cnc-site
heroku pg:psql -a cnc-site

# to attach existing postgres to this separate running program on Heroku
heroku addons:attach postgresql-dbname -a cnc-db-cron
```

## Docker Compose - Local DB Setup

Launch a PSQL docker image exposed on port 5432 and setup with provided scripts

```bash
cd db-setup
docker-compose up -d

# this should allow you to use the file to generate commands
docker exec -it cnc-matches psql -U dbuser cnc-matches
\i dbsetup.sql;
# or alternatively this
psql -h "192.168.99.100" -p "5432" -U "danku" -d "cnc-matches" -f "dbsetup.sql"
# useful command for clearing postgres data ->
docker rm -f -v cnc-matches
```

You can create a .env file in the project home directory with your credentials.

```
# staging/dev test values
DB_USER=""
DB_PASSWORD=""
DB_HOST=""
DB_NAME=""
DB_PORT=""
```

## Useful SQL

Deleting Duplicate Rows (not super optimal due to two separate SQL queries)

```
WITH cte AS (
    SELECT
        starttime,
        ROW_NUMBER() OVER (
            PARTITION BY
                starttime
            ORDER BY
                starttime
        ) row_num
     FROM
        matches
)
DELETE FROM cte
WHERE row_num > 1;

DELETE FROM matches a
WHERE a.ctid <> (SELECT min(b.ctid)
                 FROM   matches b
                 WHERE  a.starttime = b.starttime);
```
