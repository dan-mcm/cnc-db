# cnc-db

Used to bootstrap connections to Petroglyph/EA API and dump into a DB.
Also includes docker-compose for bootstrapping a local database.

.env file is used for storing DB connection details as well as API endpoint.

## DB Production - Heroku Setup

Useful Commands

```
heroku login
heroku pg:info -a cnc-site
heroku pg:psql -a cnc-site

#to attach existing postgres to this separate running program on Heroku
heroku addons:attach postgresql-dbname -a cnc-db-cron
```

## Docker Compose - Local DB Setup

Launch a PSQL docker image exposed on port 5432 and setup with provided scripts

```bash
cd db-setup
docker-compose up -d

# this should allow you to use the file to generate commands
docker exec -it cnc-matches psql -U danku cnc-matches
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
