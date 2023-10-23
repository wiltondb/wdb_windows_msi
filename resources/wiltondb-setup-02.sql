
CREATE EXTENSION IF NOT EXISTS babelfishpg_tds CASCADE;
GRANT ALL ON SCHEMA sys to wilton;
ALTER SYSTEM SET babelfishpg_tsql.database_name = 'wilton';
ALTER DATABASE wilton SET babelfishpg_tsql.migration_mode = 'multi-db';
SELECT pg_reload_conf();
CALL sys.initialize_babelfish('wilton');