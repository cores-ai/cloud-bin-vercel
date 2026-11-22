import { photoBytes, verifyPhotoToken } from "../../../../lib/d1";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SECRET = process.env.AUTH_SECRET || "momo_nuclear_vault_secret_key_8844";

async function isAuthorized(request) {
  const expectedPasscode = process.env.APP_PASSCODE || process.env.PASSCODE;
  if (!expectedPasscode) return true;

  const tokenCookie = request.cookies.get("vault_session")?.value;
  if (!tokenCookie) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`vault:${expectedPasscode}`));
  const expectedHash = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return tokenCookie === expectedHash;
}

export async function GET(request, { params }) {
  const token = params.id;
  const verifiedId = verifyPhotoToken(token);
  if (!verifiedId) {
    return new Response("Not found", { status: 404 });
  }

  // Defense-in-depth: If requested via raw numeric ID (no cryptographic signature), require verified session
  if (!String(token).includes(".")) {
    const authed = await isAuthorized(request);
    if (!authed) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const row = await photoBytes(verifiedId);
  if (!row?.image_base64) {
    return new Response("Not found", { status: 404 });
  }

  const bytes = Buffer.from(row.image_base64, "base64");
  return new Response(bytes, {
    headers: {
      "Content-Type": row.mime_type || "image/jpeg",
      // Strict anti-caching headers for private photos
      "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
