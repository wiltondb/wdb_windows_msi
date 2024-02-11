
CREATE EXTENSION IF NOT EXISTS babelfishpg_tds CASCADE;
GRANT ALL ON SCHEMA sys to :username;

ALTER SYSTEM SET babelfishpg_tds.port = :tds_port;
ALTER SYSTEM SET babelfishpg_tsql.database_name = :dbname_quoted;

ALTER DATABASE :dbname SET babelfishpg_tsql.migration_mode = :migration_mode;
SELECT pg_reload_conf();
CALL sys.initialize_babelfish(:username_quoted);
