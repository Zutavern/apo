-- Füge wind_direction Spalte zur current_weather Tabelle hinzu
ALTER TABLE current_weather 
ADD COLUMN IF NOT EXISTS wind_direction INTEGER; 