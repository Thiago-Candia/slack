# Base de datos

## Solid Queue, Solid Cache y Solid Cable

En producción comparten la base de datos principal. Por eso sus tablas se crean con una migración normal (`db/migrate/20261125120000_create_solid_queue_cache_and_cable_tables.rb`) en lugar de los archivos de schema separados que genera Rails.
