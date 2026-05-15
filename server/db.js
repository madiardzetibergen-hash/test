import pg from "pg";

const { Pool } = pg;

let pool = null;

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL
  );
}

export function getPool() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "Database URL is missing. Add DATABASE_URL or DATABASE_URL_POSTGRES_URL in Vercel Environment Variables."
    );
  }

  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return pool;
}

export async function initDatabase() {
  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      role VARCHAR(20) NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function saveMessage(role, text) {
  const db = getPool();

  const result = await db.query(
    `
    INSERT INTO messages (role, text)
    VALUES ($1, $2)
    RETURNING id, role, text, created_at;
    `,
    [role, text]
  );

  return result.rows[0];
}

export async function getMessages() {
  const db = getPool();

  const result = await db.query(`
    SELECT id, role, text, created_at
    FROM messages
    ORDER BY created_at ASC;
  `);

  return result.rows;
}

export async function clearMessages() {
  const db = getPool();

  await db.query("DELETE FROM messages");
}