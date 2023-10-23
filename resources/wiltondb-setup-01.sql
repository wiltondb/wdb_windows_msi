
ALTER SYSTEM SET logging_collector = ON;
ALTER SYSTEM SET log_directory = 'log';
ALTER SYSTEM SET log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log';
ALTER SYSTEM SET log_rotation_age = '1d';

ALTER SYSTEM SET max_connections = 256;
ALTER SYSTEM SET ssl = ON;
ALTER SYSTEM SET shared_preload_libraries = 'babelfishpg_tds';

CREATE USER wilton WITH SUPERUSER CREATEDB CREATEROLE PASSWORD 'wilton' INHERIT;
CREATE DATABASE wilton OWNER wilton;
