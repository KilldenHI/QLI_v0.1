const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'moscow_districts',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function seedDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('Checking if districts already exist...');
        
        // Проверяем существование таблицы districts
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'districts'
            );
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.log('Table districts does not exist! Please run init.sql first');
            return;
        }
        
        const countResult = await client.query('SELECT COUNT(*) FROM districts');
        const count = parseInt(countResult.rows[0].count);
        
        if (count > 0) {
            console.log(`Database already has ${count} districts. Skipping seed.`);
            return;
        }
        
        console.log('Loading GeoJSON file...');
        const geojsonPath = path.join(__dirname, '../../data/moscow_districts.geojson');
        
        if (!fs.existsSync(geojsonPath)) {
            console.error(`GeoJSON file not found at ${geojsonPath}`);
            return;
        }
        
        const geojsonData = fs.readFileSync(geojsonPath, 'utf8');
        const geojson = JSON.parse(geojsonData);
        
        console.log(`Found ${geojson.features.length} districts in GeoJSON`);
        
        await client.query('BEGIN');
        
        let importedCount = 0;
        
        for (const feature of geojson.features) {
            const name = feature.properties.district;
            
            if (!name) {
                console.warn('Skipping feature without district name');
                continue;
            }
            
            const geometry = JSON.stringify(feature.geometry);
            
            // Сохраняем ID как есть (из GeoJSON или автоинкремент)
            const result = await client.query(`
                INSERT INTO districts (district, geom)
                VALUES ($1, ST_GeomFromGeoJSON($2))
                RETURNING id
            `, [name, geometry]);
            
            importedCount++;
            
            if (importedCount % 20 === 0) {
                console.log(`Imported ${importedCount} districts...`);
            }
        }
        
        await client.query('COMMIT');
        
        console.log(`\n=== Seeding Complete ===`);
        console.log(`Successfully imported: ${importedCount} districts`);
        
        // Update centers
        await client.query(`
            UPDATE districts 
            SET center = ST_Centroid(geom)
            WHERE center IS NULL
        `);
        
        // Verify
        const finalCount = await client.query('SELECT COUNT(*) FROM districts');
        console.log(`Total districts in database: ${finalCount.rows[0].count}`);
        
        // Show sample
        const sample = await client.query('SELECT id, district FROM districts LIMIT 5');
        console.log('Sample districts:', sample.rows);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error seeding database:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

seedDatabase().catch(console.error);