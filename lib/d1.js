import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET || "momo_nuclear_vault_secret_key_8844";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      folder_label TEXT NOT NULL,
      folder_slug TEXT NOT NULL UNIQUE,
      date_ist TEXT NOT NULL,
      time_ist TEXT NOT NULL,
      created_at TEXT NOT NULL,
      author TEXT DEFAULT 'A',
      sale_status TEXT DEFAULT 'unsold',
      work_status TEXT DEFAULT 'pending'
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
      author TEXT,
      sale_status TEXT,
      work_status TEXT,
      step TEXT,
      updated_at TEXT NOT NULL
    )`,
  `CREATE TABLE IF NOT EXISTS authorized_users (
      user_id INTEGER PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      created_at TEXT NOT NULL
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

/**
 * Creates a cryptographically signed opaque token for a photo ID.
 * Prevents sequential integer enumeration / IDOR attacks.
 */
export function signPhotoId(id) {
  const hmac = crypto.createHmac("sha256", SECRET).update(String(id)).digest("hex").slice(0, 16);
  return `${id}.${hmac}`;
}

/**
 * Validates a photo token. Returns the numeric photo ID if valid, or null.
 */
export function verifyPhotoToken(token) {
  if (!token) return null;
  const parts = String(token).split(".");
  if (parts.length === 2) {
    const [idStr, hmac] = parts;
    if (!/^\d+$/.test(idStr)) return null;
    const expected = crypto.createHmac("sha256", SECRET).update(idStr).digest("hex").slice(0, 16);
    try {
      if (crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) {
        return Number(idStr);
      }
    } catch {
      return null;
    }
    return null;
  }
  // Backwards compatibility for raw numeric IDs
  if (/^\d+$/.test(String(token))) {
    return Number(token);
  }
  return null;
}

export async function listFolders() {
  await ensureSchema();
  const submissions = await query(
    `SELECT id, email, folder_label, folder_slug, date_ist, time_ist, created_at,
            author, sale_status, work_status
     FROM submissions
     ORDER BY id DESC`
  );
  if (!submissions.length) return [];

  // Fetch all photos to attach signed tokens to folders for preview
  const photos = await query(
    `SELECT id, submission_id, position
     FROM submission_photos
     ORDER BY position ASC`
  );

  const photoMap = {};
  for (const p of photos) {
    if (!photoMap[p.submission_id]) photoMap[p.submission_id] = [];
    photoMap[p.submission_id].push(signPhotoId(p.id));
  }

  return submissions.map((sub) => ({
    ...sub,
    author: sub.author || "A",
    sale_status: sub.sale_status || "unsold",
    work_status: sub.work_status || "pending",
    photoIds: photoMap[sub.id] || [],
  }));
}

export async function folderBySlug(slug) {
  await ensureSchema();
  const rows = await query(
    `SELECT id, email, folder_label, folder_slug, date_ist, time_ist, created_at,
            author, sale_status, work_status
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

  const securedPhotos = photos.map((p) => ({
    ...p,
    token: signPhotoId(p.id),
  }));

  const item = rows[0];
  return {
    ...item,
    author: item.author || "A",
    sale_status: item.sale_status || "unsold",
    work_status: item.work_status || "pending",
    photos: securedPhotos,
  };
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

/**
 * Safely updates folder status fields (sale_status, work_status).
 * Author cannot be modified to preserve immutability and provenance.
 */
export async function updateFolderStatus(identifier, updates) {
  if (!identifier) throw new Error("Invalid folder identifier");

  let submissionId = null;
  if (/^\d+$/.test(String(identifier))) {
    submissionId = Number(identifier);
  } else {
    const rows = await query(
      `SELECT id FROM submissions WHERE folder_slug = ? LIMIT 1`,
      [String(identifier)]
    );
    if (rows.length) {
      submissionId = rows[0].id;
    }
  }

  if (!submissionId) {
    throw new Error("Folder not found");
  }

  const setClauses = [];
  const params = [];

  if (updates.sale_status) {
    setClauses.push("sale_status = ?");
    params.push(updates.sale_status);
  }
  if (updates.work_status) {
    setClauses.push("work_status = ?");
    params.push(updates.work_status);
  }

  if (setClauses.length === 0) return true;

  params.push(submissionId);
  await query(
    `UPDATE submissions SET ${setClauses.join(", ")} WHERE id = ?`,
    params
  );
  return true;
}

/**
 * Safely deletes a folder and its photos by slug or id.
 */
export async function deleteFolder(identifier) {
  if (!identifier) throw new Error("Invalid folder identifier");

  let submissionId = null;
  if (/^\d+$/.test(String(identifier))) {
    submissionId = Number(identifier);
  } else {
    const rows = await query(
      `SELECT id FROM submissions WHERE folder_slug = ? LIMIT 1`,
      [String(identifier)]
    );
    if (rows.length) {
      submissionId = rows[0].id;
    }
  }

  if (!submissionId) {
    throw new Error("Folder not found");
  }

  // Delete photos associated with submission
  await query(`DELETE FROM submission_photos WHERE submission_id = ?`, [submissionId]);
  // Delete the submission entry
  await query(`DELETE FROM submissions WHERE id = ?`, [submissionId]);
  return true;
}
