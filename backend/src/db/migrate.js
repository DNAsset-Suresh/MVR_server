import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool, isDbConfigured, testDbConnection } from '../config/db.js';
import { VERIFIED_BOOKS_CATALOG } from '../services/bookstoreService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERIFIED_SERVICES_SEED = [
  {
    id: 'corporate-workshops',
    title: 'Corporate Workshops',
    title_tamil: 'கார்ப்பரேட் பட்டறைகள்',
    category: 'Executive & Enterprises',
    description: 'High-impact corporate workshops to accelerate ownership, executive communication, and high-trust leadership culture.',
    duration: 'Half-Day (3.5 hrs) or Full-Day Intensive'
  },
  {
    id: 'youth-motivation',
    title: 'Youth Motivation',
    title_tamil: 'இளைஞர் ஊக்கம்',
    category: 'Universities & Youth Summits',
    description: 'Electrifying sessions tailored to ignite self-belief, future-ready focus, academic resilience, and career courage in students.',
    duration: '90 - 120 Minutes Keynote + Q&A'
  },
  {
    id: 'team-building',
    title: 'Team Building',
    title_tamil: 'குழு உருவாக்கம்',
    category: 'Teams & Departments',
    description: 'Dynamic team synergy experiences crafted to dismantle departmental silos and unleash collaborative peak performance.',
    duration: '2 to 4 Hours Experiential Workshop'
  }
];

export async function runMigrations() {
  console.log('--- InspireUp Database Migration Runner ---');

  if (!isDbConfigured()) {
    console.error('Migration aborted: PostgreSQL credentials are not configured in environment.');
    console.error('Please configure PGHOST, PGPORT, PGDATABASE, PGUSER, and PGPASSWORD (or DATABASE_URL) in your .env file.');
    return { success: false, reason: 'unconfigured' };
  }

  const connTest = await testDbConnection();
  if (!connTest.ok) {
    console.error(`Migration aborted: ${connTest.error}`);
    return { success: false, reason: 'connection_failed', error: connTest.error };
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    // 1. Inspect existing schema tables
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    const existingTables = tableRes.rows.map((r) => r.table_name);
    console.log(`Existing tables in public schema: [${existingTables.join(', ') || 'None'}]`);

    // 2. Automated Safety Backup for any pre-existing table
    const timestamp = Date.now();
    for (const tbl of ['services', 'speaking_slots', 'bookings']) {
      if (existingTables.includes(tbl)) {
        const countRes = await client.query(`SELECT count(*)::int AS cnt FROM ${tbl};`);
        const rowCount = countRes.rows[0].cnt;
        if (rowCount > 0) {
          const backupTbl = `${tbl}_backup_${timestamp}`;
          console.log(`Creating non-destructive backup of existing table '${tbl}' (${rowCount} rows) -> '${backupTbl}'...`);
          await client.query(`CREATE TABLE IF NOT EXISTS ${backupTbl} AS SELECT * FROM ${tbl};`);
          console.log(`✓ Backup table '${backupTbl}' created successfully.`);
        }
      }
    }

    // 3. Begin Migration Transaction
    await client.query('BEGIN');

    // Ensure schema_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if 001_initial_schema.sql was already executed
    const migrationCheck = await client.query(
      'SELECT migration_name FROM schema_migrations WHERE migration_name = $1;',
      ['001_initial_schema.sql']
    );

    if (migrationCheck.rows.length > 0) {
      console.log('Notice: Migration 001_initial_schema.sql has already been applied.');
    } else {
      console.log('Applying migration: 001_initial_schema.sql...');
      const sqlPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      await client.query(sqlContent);

      await client.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1);',
        ['001_initial_schema.sql']
      );
      console.log('✓ Migration 001_initial_schema.sql applied and recorded successfully.');
    }

    // Check if 002_bookstore_and_orders.sql was already executed
    const migration002Check = await client.query(
      'SELECT migration_name FROM schema_migrations WHERE migration_name = $1;',
      ['002_bookstore_and_orders.sql']
    );

    if (migration002Check.rows.length > 0) {
      console.log('Notice: Migration 002_bookstore_and_orders.sql has already been applied.');
    } else {
      console.log('Applying migration: 002_bookstore_and_orders.sql...');
      const sqlPath = path.join(__dirname, 'migrations', '002_bookstore_and_orders.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      await client.query(sqlContent);

      await client.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1);',
        ['002_bookstore_and_orders.sql']
      );
      console.log('✓ Migration 002_bookstore_and_orders.sql applied and recorded successfully.');
    }

    // 4. Seed verified services catalog if empty
    const servicesCountRes = await client.query('SELECT count(*)::int AS cnt FROM services;');
    if (servicesCountRes.rows[0].cnt === 0) {
      console.log('Seeding verified services catalog into database...');
      for (const s of VERIFIED_SERVICES_SEED) {
        await client.query(
          `INSERT INTO services (id, title, title_tamil, category, description, duration)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING;`,
          [s.id, s.title, s.title_tamil, s.category, s.description, s.duration]
        );
      }
      console.log('✓ Verified services catalog seeded.');
    }

    // 5. Seed verified books catalog if books table is empty
    const booksCountRes = await client.query('SELECT count(*)::int AS cnt FROM books;');
    if (booksCountRes.rows[0].cnt === 0) {
      console.log('Seeding verified books catalog into database...');
      for (const b of VERIFIED_BOOKS_CATALOG) {
        await client.query(
          `INSERT INTO books (id, title, title_tamil, author, category, price, mrp, stock_quantity, description, full_synopsis, format, pages, language, badge, isbn, cover_image)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           ON CONFLICT (id) DO NOTHING;`,
          [
            b.id,
            b.title,
            b.title_tamil,
            b.author,
            b.category,
            b.price,
            b.mrp,
            b.stock_quantity,
            b.description,
            b.full_synopsis,
            b.format,
            b.pages,
            b.language,
            b.badge,
            b.isbn,
            b.cover_image
          ]
        );
      }
      console.log('✓ Verified books catalog seeded.');
    }

    // 6. Seed upcoming slots if speaking_slots is empty
    const slotsCountRes = await client.query('SELECT count(*)::int AS cnt FROM speaking_slots;');
    if (slotsCountRes.rows[0].cnt === 0) {
      console.log('Seeding initial speaking slots for Q4 2026...');
      const sampleSeedSlots = [
        { date: '2026-11-20', time: 'Morning Keynote (09:30 AM - 12:30 PM)', label: 'Morning Keynote Window' },
        { date: '2026-11-20', time: 'Afternoon Workshop (02:00 PM - 05:00 PM)', label: 'Afternoon Intensive Window' },
        { date: '2026-11-25', time: 'Morning Keynote (09:30 AM - 12:30 PM)', label: 'Executive Leadership Window' },
        { date: '2026-11-28', time: 'Morning Keynote (09:30 AM - 12:30 PM)', label: 'Youth Motivation Window' },
        { date: '2026-12-05', time: 'Morning Keynote (09:30 AM - 12:30 PM)', label: 'Annual Summit Keynote Window' }
      ];

      for (const slot of sampleSeedSlots) {
        await client.query(
          `INSERT INTO speaking_slots (slot_date, slot_time, label, status)
           VALUES ($1::date, $2, $3, 'available')
           ON CONFLICT (slot_date, slot_time) DO NOTHING;`,
          [slot.date, slot.time, slot.label]
        );
      }
      console.log('✓ Initial speaking slots seeded.');
    }

    await client.query('COMMIT');
    console.log('=== Migration process completed successfully. ===');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed and was rolled back:', err.message);
    return { success: false, error: err.message };
  } finally {
    client.release();
  }
}

// Direct execution from CLI
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations()
    .then((res) => {
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal migration error:', err);
      process.exit(1);
    });
}
