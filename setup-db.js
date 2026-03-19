const { Client } = require('pg');

async function setup() {
  const url = process.env.POSTGRES_URL_NON_POOLING;
  if (!url) {
    throw new Error('POSTGRES_URL_NON_POOLING is missing from environment');
  }

  // Ensure ?sslmode= is stripped so our custom ssl object takes precedence
  const connectionString = url.split('?')[0];

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  
  console.log('Connected to PostgreSQL. Creating tables...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pin TEXT NOT NULL,
      "createdAt" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      destination TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      "createdBy" TEXT REFERENCES users(id),
      "memberIds" TEXT[] DEFAULT '{}',
      "createdAt" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      "tripId" TEXT REFERENCES trips(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      category TEXT NOT NULL,
      "paidBy" TEXT REFERENCES users(id),
      "splitAmong" TEXT[] DEFAULT '{}',
      "createdAt" TEXT NOT NULL
    );
  `);
  
  console.log('Database tables verified/created successfully!');
  await client.end();
}

setup().catch((e) => {
  console.error('Error during setup:', e);
  process.exit(1);
});
