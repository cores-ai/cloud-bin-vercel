const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      folder_label TEXT NOT NULL,
      folder_slug TEXT NOT NULL UNIQUE,
      date_ist TEXT NOT NULL,
      time_ist TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
  `CREATE TABLE IF NOT EXISTS submission_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      image_base64 TEXT NOT NULL
    )`,
  `CREATE TABLE IF NOT EXISTS intake_drafts (
      owner_id INTEGER PRIMARY KEY,
      email TEXT,
      photo1_b64 TEXT,
      photo1_mime TEXT,
      photo2_b64 TEXT,
      photo2_mime TEXT,
      updated_at TEXT NOT NULL
    )`,
];

export function config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
  const apiToken = process.env.CLOUDFLARE_API_TOKEN || "";
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID || "";
  if (!accountId || !apiToken || !databaseId) {
    return null;
  }
  return { accountId, apiToken, databaseId };
}

async function query(sql, params = []) {
  const cfg = config();
  if (!cfg) {
    throw new Error("Missing Cloudflare D1 env");
  }
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${cfg.accountId}/d1/database/${cfg.databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
      cache: "no-store",
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    const reason = data.errors ? JSON.stringify(data.errors) : response.statusText;
    throw new Error(reason || "D1 query failed");
  }
  return data.result?.[0]?.results || [];
}

async function ensureSchema() {
  for (const statement of SCHEMA) {
    await query(statement);
  }
}

export async function listFolders() {
  await ensureSchema();
  const submissions = await query(
    `SELECT id, email, folder_label, folder_slug, date_ist, time_ist, created_at
     FROM submissions
     ORDER BY id DESC`
  );
  if (!submissions.length) return [];

  // Fetch all photo IDs to attach to folders for visual card preview
  const photos = await query(
    `SELECT id, submission_id, position
     FROM submission_photos
     ORDER BY position ASC`
  );

  const photoMap = {};
  for (const p of photos) {
    if (!photoMap[p.submission_id]) photoMap[p.submission_id] = [];
    photoMap[p.submission_id].push(p.id);
  }

  return submissions.map((sub) => ({
    ...sub,
    photoIds: photoMap[sub.id] || [],
  }));
}

export async function folderBySlug(slug) {
  await ensureSchema();
  const rows = await query(
    `SELECT id, email, folder_label, folder_slug, date_ist, time_ist, created_at
     FROM submissions
     WHERE folder_slug = ?
     LIMIT 1`,
    [slug]
  );
  if (!rows.length) return null;
  const photos = await query(
    `SELECT id, position, mime_type
     FROM submission_photos
     WHERE submission_id = ?
     ORDER BY position ASC`,
    [rows[0].id]
  );
  return { ...rows[0], photos };
}

export async function photoBytes(id) {
  const rows = await query(
    `SELECT mime_type, image_base64
     FROM submission_photos
     WHERE id = ?
     LIMIT 1`,
    [Number(id)]
  );
  return rows[0] || null;
}
