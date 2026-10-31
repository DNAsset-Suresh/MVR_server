import { getPool, isDbConfigured, testDbConnection } from '../config/db.js';

export async function inspectDatabaseStatus() {
  console.log('=== InspireUp Database Inspection & Status Report ===');

  if (!isDbConfigured()) {
    console.log('Configuration Status: Awaiting PostgreSQL credentials in backend .env file.');
    console.log('See .env.example for required PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD parameters.');
    return { configured: false };
  }

  console.log('Configuration Status: Credentials detected in environment.');
  console.log('Testing connectivity to PostgreSQL server...');

  const connResult = await testDbConnection();
  if (!connResult.ok) {
    console.log(`Connection Test: Failed - ${connResult.error}`);
    return { configured: true, connected: false, error: connResult.error };
  }

  console.log('Connection Test: Connected successfully.');

  const pool = getPool();
  try {
    const tableRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tables = tableRes.rows.map((r) => r.table_name);
    console.log(`\nExisting Tables in public schema (${tables.length}):`);

    const tableStats = [];
    for (const tbl of tables) {
      const countRes = await pool.query(`SELECT count(*)::int AS cnt FROM ${tbl};`);
      const cnt = countRes.rows[0].cnt;
      tableStats.push({ table: tbl, rows: cnt });
      console.log(` - ${tbl}: ${cnt} rows`);
    }

    let appliedMigrations = [];
    if (tables.includes('schema_migrations')) {
      const migRes = await pool.query('SELECT migration_name, applied_at FROM schema_migrations ORDER BY id ASC;');
      appliedMigrations = migRes.rows;
      console.log(`\nApplied Migrations (${appliedMigrations.length}):`);
      appliedMigrations.forEach((m) => {
        console.log(` ✓ ${m.migration_name} (applied: ${m.applied_at})`);
      });
    } else {
      console.log('\nNotice: schema_migrations table does not exist. No migrations have been run yet.');
    }

    return {
      configured: true,
      connected: true,
      tables: tableStats,
      appliedMigrations
    };
  } catch (err) {
    console.error('Inspection query error:', err.message);
    return { configured: true, connected: true, error: err.message };
  }
}

if (process.argv[1] && process.argv[1].endsWith('status.js')) {
  inspectDatabaseStatus()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
