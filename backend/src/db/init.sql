-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Drop tables if exists (для пересоздания)
DROP TABLE IF EXISTS moscow_ecorating CASCADE;
DROP TABLE IF EXISTS districts_info CASCADE;
DROP TABLE IF EXISTS districts CASCADE;

-- Create districts table (геометрия районов)
CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    district VARCHAR(255) NOT NULL,
    geom GEOMETRY(MultiPolygon, 4326) NOT NULL,
    center GEOMETRY(Point, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create districts_info table (информация о районах)
CREATE TABLE districts_info (
    id INTEGER PRIMARY KEY REFERENCES districts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    smolInf TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create moscow_ecorating table (экологический рейтинг районов)
CREATE TABLE moscow_ecorating (
    id SERIAL PRIMARY KEY,
    district_name VARCHAR(255) NOT NULL,
    district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    average_ball DECIMAL(5,2),
    rating INTEGER,
    density_population DECIMAL(10,2),
    highway_congestion DECIMAL(5,2),
    green_area DECIMAL(10,2),
    negative_objects INTEGER,
    cell_towers INTEGER,
    dop_ball DECIMAL(5,2),
    situation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial indexes
CREATE INDEX idx_districts_geom ON districts USING GIST (geom);
CREATE INDEX idx_districts_center ON districts USING GIST (center);

-- Create indexes for moscow_ecorating
CREATE INDEX idx_ecorating_district_id ON moscow_ecorating (did);
CREATE INDEX idx_ecorating_district_name ON moscow_ecorating (district_name);

-- Create function to update center automatically
CREATE OR REPLACE FUNCTION update_district_center()
RETURNS TRIGGER AS $$
BEGIN
    NEW.center = ST_Centroid(NEW.geom);
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger for districts
DROP TRIGGER IF EXISTS set_district_center ON districts;
CREATE TRIGGER set_district_center
    BEFORE INSERT OR UPDATE OF geom ON districts
    FOR EACH ROW
    EXECUTE FUNCTION update_district_center();

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_districts_info_updated_at ON districts_info;
CREATE TRIGGER update_districts_info_updated_at
    BEFORE UPDATE ON districts_info
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ecorating_updated_at ON moscow_ecorating;
CREATE TRIGGER update_ecorating_updated_at
    BEFORE UPDATE ON moscow_ecorating
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();