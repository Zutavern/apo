-- Erstelle die offer_settings Tabelle
CREATE TABLE IF NOT EXISTS offer_settings (
    id SERIAL PRIMARY KEY,
    background_color VARCHAR(7) NOT NULL DEFAULT '#1f2937',
    display_duration INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Erstelle einen Trigger für das automatische Aktualisieren von updated_at
CREATE OR REPLACE FUNCTION update_offer_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_offer_settings_updated_at
    BEFORE UPDATE ON offer_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_offer_settings_updated_at();

-- Stelle sicher, dass nur ein Eintrag existiert
CREATE OR REPLACE FUNCTION ensure_single_offer_settings_row()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM offer_settings) > 0 THEN
        -- Wenn bereits ein Eintrag existiert, aktualisiere diesen stattdessen
        UPDATE offer_settings
        SET background_color = NEW.background_color,
            display_duration = NEW.display_duration,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT id FROM offer_settings LIMIT 1);
        RETURN NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_offer_settings_row
    BEFORE INSERT ON offer_settings
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_offer_settings_row();

-- Füge den initialen Eintrag hinzu
INSERT INTO offer_settings (background_color, display_duration)
VALUES ('#1f2937', 30)
ON CONFLICT DO NOTHING; 