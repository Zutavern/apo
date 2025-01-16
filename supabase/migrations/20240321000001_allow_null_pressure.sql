-- Erlaube NULL-Werte in der pressure_mean Spalte
ALTER TABLE daily_forecast 
ALTER COLUMN pressure_mean DROP NOT NULL; 