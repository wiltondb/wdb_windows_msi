
ALTER SYSTEM SET logging_collector = :enable_logging_collector;
ALTER SYSTEM SET log_directory = :log_directory;
ALTER SYSTEM SET log_filename = :log_filename;
ALTER SYSTEM SET log_rotation_age = '1d';
ALTER SYSTEM SET log_truncate_on_rotation = 'on';

ALTER SYSTEM SET port = :postgres_port;
ALTER SYSTEM SET max_connections = :max_connections;
ALTER SYSTEM SET ssl = :enable_ssl;
ALTER SYSTEM SET shared_preload_libraries = 'babelfishpg_tds','pg_stat_statements','system_stats';

CREATE USER :username WITH SUPERUSER CREATEDB CREATEROLE PASSWORD :user_password INHERIT;
CREATE DATABASE :dbname OWNER :username;
