-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Drop tables if exists (для пересоздания)
DROP TABLE IF EXISTS districts_all_inf CASCADE;
DROP TABLE IF EXISTS moscow_ecorating CASCADE;
DROP TABLE IF EXISTS districts_info CASCADE;
DROP TABLE IF EXISTS districts CASCADE;

-- =====================================================
-- Таблица districts (границы районов)
-- =====================================================
CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    district VARCHAR(255) NOT NULL,
    geom GEOMETRY(MultiPolygon, 4326) NOT NULL,
    center GEOMETRY(Point, 4326),
    quality_index DECIMAL(5,2),
    quality_index_updated TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Таблица districts_info (краткая информация о районах)
-- =====================================================
CREATE TABLE districts_info (
    id INTEGER PRIMARY KEY REFERENCES districts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    smolInf TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Таблица moscow_ecorating (экологический рейтинг)
-- =====================================================
CREATE TABLE moscow_ecorating (
    id INTEGER PRIMARY KEY REFERENCES districts(id) ON DELETE CASCADE,
    district_name VARCHAR(255) NOT NULL,
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

-- =====================================================
-- Таблица districts_all_inf (полная инфраструктура)
-- =====================================================
CREATE TABLE districts_all_inf (
    id INTEGER PRIMARY KEY REFERENCES districts(id) ON DELETE CASCADE,
    district_name VARCHAR(255) NOT NULL,
    metro_exits INTEGER DEFAULT 0,
    med_institutions INTEGER DEFAULT 0,
    schools INTEGER DEFAULT 0,
    leisure_facilities INTEGER DEFAULT 0,
    average_ball DECIMAL(5,2),
    crime_per_1000 DECIMAL(6,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- Индексы для оптимизации запросов
-- =====================================================
CREATE INDEX idx_districts_geom ON districts USING GIST (geom);
CREATE INDEX idx_districts_center ON districts USING GIST (center);
CREATE INDEX idx_districts_quality ON districts (quality_index);
CREATE INDEX idx_districts_name ON districts (district);
CREATE INDEX idx_ecorating_district_name ON moscow_ecorating (district_name);
CREATE INDEX idx_all_inf_district_name ON districts_all_inf (district_name);

-- =====================================================
-- Функция автоматического обновления центра полигона
-- =====================================================
CREATE OR REPLACE FUNCTION update_district_center()
RETURNS TRIGGER AS $$
BEGIN
    NEW.center = ST_Centroid(NEW.geom);
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Триггер для обновления центра
DROP TRIGGER IF EXISTS set_district_center ON districts;
CREATE TRIGGER set_district_center
    BEFORE INSERT OR UPDATE OF geom ON districts
    FOR EACH ROW
    EXECUTE FUNCTION update_district_center();

-- =====================================================
-- Функция автоматического обновления updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Триггеры для обновления updated_at
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

DROP TRIGGER IF EXISTS update_all_inf_updated_at ON districts_all_inf;
CREATE TRIGGER update_all_inf_updated_at
    BEFORE UPDATE ON districts_all_inf
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();