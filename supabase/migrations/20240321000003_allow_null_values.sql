-- Erlaube NULL-Werte für feels_like in current_weather
ALTER TABLE current_weather 
ALTER COLUMN feels_like DROP NOT NULL;

-- Erlaube NULL-Werte für pressure_mean in daily_forecast
ALTER TABLE daily_forecast 
ALTER COLUMN pressure_mean DROP NOT NULL; 