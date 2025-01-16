-- Erstelle Enum-Typen für Warnungsschweregrade und Pollenlevel
CREATE TYPE severity_level AS ENUM ('Minor', 'Moderate', 'Severe', 'Extreme');
CREATE TYPE pollen_level AS ENUM ('None', 'Low', 'Medium', 'High');

-- Erstelle Tabelle für Standorte
CREATE TABLE locations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Erstelle Tabelle für aktuelle Wetterdaten
CREATE TABLE current_weather (
  location_id BIGINT PRIMARY KEY REFERENCES locations(id),
  temperature DECIMAL(4,1) NOT NULL,
  humidity INTEGER NOT NULL,
  feels_like DECIMAL(4,1) NOT NULL,
  precipitation DECIMAL(5,2) NOT NULL,
  wind_speed DECIMAL(4,1) NOT NULL,
  weather_code INTEGER NOT NULL,
  is_day BOOLEAN NOT NULL,
  uv_index DECIMAL(3,1) NOT NULL,
  pressure DECIMAL(6,1) NOT NULL,
  surface_pressure DECIMAL(6,1) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Erstelle Tabelle für tägliche Vorhersage
CREATE TABLE daily_forecast (
  location_id BIGINT REFERENCES locations(id),
  forecast_date DATE NOT NULL,
  temp_max DECIMAL(4,1) NOT NULL,
  temp_min DECIMAL(4,1) NOT NULL,
  precipitation_sum DECIMAL(5,2) NOT NULL,
  weather_code INTEGER NOT NULL,
  sunrise TIMESTAMPTZ NOT NULL,
  sunset TIMESTAMPTZ NOT NULL,
  uv_index_max DECIMAL(3,1) NOT NULL,
  pressure_mean DECIMAL(6,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (location_id, forecast_date)
);

-- Erstelle Tabelle für stündliche Vorhersage
CREATE TABLE hourly_forecast (
  location_id BIGINT REFERENCES locations(id),
  forecast_time TIMESTAMPTZ NOT NULL,
  temperature DECIMAL(4,1) NOT NULL,
  humidity INTEGER NOT NULL,
  pressure DECIMAL(6,1) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (location_id, forecast_time)
);

-- Erstelle Tabelle für Pollendaten
CREATE TABLE pollen_data (
  location_id BIGINT REFERENCES locations(id),
  measurement_time TIMESTAMPTZ NOT NULL,
  alder_level pollen_level NOT NULL,
  birch_level pollen_level NOT NULL,
  grass_level pollen_level NOT NULL,
  mugwort_level pollen_level NOT NULL,
  ragweed_level pollen_level NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (location_id, measurement_time)
);

-- Erstelle Tabelle für Wetterwarnungen
CREATE TABLE weather_warnings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  location_id BIGINT REFERENCES locations(id),
  event_type VARCHAR(255) NOT NULL,
  severity severity_level NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Erstelle Trigger für automatische Aktualisierung von updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_current_weather_updated_at
  BEFORE UPDATE ON current_weather
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_forecast_updated_at
  BEFORE UPDATE ON daily_forecast
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hourly_forecast_updated_at
  BEFORE UPDATE ON hourly_forecast
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pollen_data_updated_at
  BEFORE UPDATE ON pollen_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weather_warnings_updated_at
  BEFORE UPDATE ON weather_warnings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Füge Initial-Daten für Hohenmölsen hinzu
INSERT INTO locations (name, latitude, longitude)
VALUES ('Hohenmölsen', 51.1667, 12.0833); 