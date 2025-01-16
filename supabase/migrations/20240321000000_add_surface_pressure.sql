-- Füge surface_pressure Spalte zur current_weather Tabelle hinzu
ALTER TABLE current_weather 
ADD COLUMN IF NOT EXISTS surface_pressure DECIMAL(6,1);

-- Aktualisiere bestehende Zeilen, setze surface_pressure gleich pressure
UPDATE current_weather 
SET surface_pressure = pressure 
WHERE surface_pressure IS NULL; 