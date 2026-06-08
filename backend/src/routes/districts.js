const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'moscow_districts',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

// ============= ЗАПРОСЫ ДЛЯ КАРТЫ (только геометрия) =============

// GET /api/districts/geojson - получить границы районов + рейтинг для карты
router.get('/geojson', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                d.id,
                d.district as name,
                ST_AsGeoJSON(d.geom) AS geometry,
                er.rating,
                er.average_ball,
                er.dop_ball
            FROM districts d
            LEFT JOIN moscow_ecorating er ON d.id = er.id
            ORDER BY d.id
        `);

        const features = result.rows.map(row => ({
            type: 'Feature',
            id: row.id,
            properties: {
                id: row.id,
                name: row.name,
                rating: row.rating,
                average_ball: row.average_ball,
                dop_ball: row.dop_ball
            },
            geometry: JSON.parse(row.geometry)
        }));

        res.json({
            type: 'FeatureCollection',
            features: features
        });
    } catch (error) {
        console.error('Error fetching districts geoJSON:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/districts/geojson/simple - только границы (без рейтинга) для более быстрой загрузки
router.get('/geojson/simple', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                d.id,
                d.district as name,
                ST_AsGeoJSON(d.geom) AS geometry
            FROM districts d
            ORDER BY d.id
        `);

        const features = result.rows.map(row => ({
            type: 'Feature',
            id: row.id,
            properties: {
                id: row.id,
                name: row.name
            },
            geometry: JSON.parse(row.geometry)
        }));

        res.json({
            type: 'FeatureCollection',
            features: features
        });
    } catch (error) {
        console.error('Error fetching districts geoJSON:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/districts/names - получить список районов (ID и название) для боковой панели
router.get('/names', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                d.id, 
                d.district as name
            FROM districts d
            ORDER BY d.id
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching district names:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/districts/count - получить количество районов
router.get('/count', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM districts');
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Error fetching count:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============= ЗАПРОСЫ ДЛЯ INFO PANEL (полная информация) =============

// GET /api/districts/:id/details - полная информация о районе с ИКЖ
router.get('/:id/details', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Получаем данные и рассчитываем ИКЖ
        const result = await pool.query(`
            SELECT 
                d.id,
                d.district as name,
                ST_X(ST_Centroid(d.geom)) AS center_lon,
                ST_Y(ST_Centroid(d.geom)) AS center_lat,
                -- d.quality_index,  -- Временно закомментировать
                di.smolinf,
                er.average_ball as eco_average_ball,
                er.rating,
                er.density_population,
                er.highway_congestion,
                er.green_area,
                er.negative_objects,
                er.cell_towers,
                er.dop_ball,
                er.situation,
                ai.metro_exits,
                ai.med_institutions,
                ai.schools,
                ai.leisure_facilities,
                ai.average_ball as inf_average_ball,
                ai.crime_per_1000
            FROM districts d
            LEFT JOIN districts_info di ON d.id = di.id
            LEFT JOIN moscow_ecorating er ON d.id = er.id
            LEFT JOIN districts_all_inf ai ON d.id = ai.id
            WHERE d.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'District not found' });
        }

        const row = result.rows[0];
        
        // Рассчитываем компоненты ИКЖ для отладки
        const qualityComponents = calculateQualityComponents(row);
        
        res.json({
            id: row.id,
            name: row.name,
            center: [parseFloat(row.center_lon), parseFloat(row.center_lat)],
            quality_index: parseFloat(row.quality_index) || null,
            quality_components: qualityComponents,
            smolInf: row.smolinf || 'Информация о районе будет добавлена позже',
            ecoRating: {
                average_ball: row.eco_average_ball,
                rating: row.rating,
                density_population: row.density_population,
                highway_congestion: row.highway_congestion,
                green_area: row.green_area,
                negative_objects: row.negative_objects,
                cell_towers: row.cell_towers,
                dop_ball: row.dop_ball,
                situation: row.situation || 'Данные о экологической ситуации отсутствуют'
            },
            infrastructure: {
                metro_exits: row.metro_exits || 0,
                med_institutions: row.med_institutions || 0,
                schools: row.schools || 0,
                leisure_facilities: row.leisure_facilities || 0,
                average_ball: row.inf_average_ball || 0,
                crime_per_1000: row.crime_per_1000 || 0
            }
        });
    } catch (error) {
        console.error('Error fetching district details:', error);
        res.status(500).json({ error: error.message });
    }
});

// Функция расчета компонентов ИКЖ
function calculateQualityComponents(row) {
    // Нормализация показателей (методология)
    const normalize = (value, mean, std, reverse = false) => {
        if (!value && value !== 0) return 50;
        let z = (value - mean) / std;
        if (reverse) z = -z;
        let score = 50 + z * 10;
        return Math.min(95, Math.max(5, score));
    };
    
    // Статистические параметры для Москвы (на основе данных)
    const stats = {
        eco_ball: { mean: 50, std: 15, reverse: true },      // экология: меньше = лучше
        crime: { mean: 15, std: 8, reverse: true },           // преступность: меньше = лучше
        metro: { mean: 3, std: 2.5, reverse: false },         // метро: больше = лучше
        social: { mean: 25, std: 10, reverse: false },        // соц. инфра: больше = лучше
        leisure: { mean: 8, std: 5, reverse: false }          // досуг: больше = лучше
    };
    
    // Рассчитываем нормированные баллы
    const s_eco = normalize(row.eco_average_ball, stats.eco_ball.mean, stats.eco_ball.std, stats.eco_ball.reverse);
    const s_safety = normalize(row.crime_per_1000, stats.crime.mean, stats.crime.std, stats.crime.reverse);
    const s_transport = normalize(row.metro_exits, stats.metro.mean, stats.metro.std, stats.metro.reverse);
    const s_social = normalize((row.med_institutions || 0) + (row.schools || 0), stats.social.mean, stats.social.std, stats.social.reverse);
    const s_leisure = normalize(row.leisure_facilities, stats.leisure.mean, stats.leisure.std, stats.leisure.reverse);
    
    // Веса из методологии
    const weights = {
        eco: 0.18,
        safety: 0.22,
        transport: 0.20,
        social: 0.17,
        leisure: 0.18  // досуг (0.10) + комфорт (0.08) = 0.18
    };
    
    // Мультипликативная агрегация
    const qRaw = 100 * 
        Math.pow(s_eco / 100, weights.eco) *
        Math.pow(s_safety / 100, weights.safety) *
        Math.pow(s_transport / 100, weights.transport) *
        Math.pow(s_social / 100, weights.social) *
        Math.pow(s_leisure / 100, weights.leisure);
    
    // Демпфер
    let dempfer = 1;
    if (s_safety < 20) dempfer *= (s_safety / 20);
    if (s_eco < 20) dempfer *= (s_eco / 20);
    
    const qualityIndex = Math.round(Math.max(0, Math.min(100, qRaw * dempfer)) * 100) / 100;
    
    return {
        normalized_scores: {
            ecology: Math.round(s_eco * 100) / 100,
            safety: Math.round(s_safety * 100) / 100,
            transport: Math.round(s_transport * 100) / 100,
            social: Math.round(s_social * 100) / 100,
            leisure: Math.round(s_leisure * 100) / 100
        },
        weights: weights,
        raw_index: Math.round(qRaw * 100) / 100,
        dempfer: dempfer,
        final_index: qualityIndex
    };
}

// GET /api/districts/:id/infrastructure - получить только инфраструктурные данные
router.get('/:id/infrastructure', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT 
                dai.metro_exits,
                dai.med_institutions,
                dai.schools,
                dai.leisure_facilities,
                dai.average_ball
            FROM districts_all_inf dai
            WHERE dai.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.json({ 
                id: parseInt(id),
                message: 'Данные об инфраструктуре отсутствуют'
            });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching infrastructure:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/districts/:id/ecorating - получить только экологический рейтинг
router.get('/:id/ecorating', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT * FROM moscow_ecorating WHERE id::integer = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.json({ 
                id: parseInt(id),
                message: 'Данные об экологическом рейтинге отсутствуют'
            });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching eco rating:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/districts/:id/info - получить только текстовую информацию
router.get('/:id/info', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT 
                d.id,
                d.district as name,
                di.smolinf
            FROM districts d
            LEFT JOIN districts_info di ON d.id = di.id
            WHERE d.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'District not found' });
        }
        
        res.json({
            id: result.rows[0].id,
            name: result.rows[0].name,
            smolInf: result.rows[0].smolinf || 'Информация о районе будет добавлена позже'
        });
    } catch (error) {
        console.error('Error fetching district info:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;