import { NextResponse } from "next/server";
import { deleteFolder } from "../../../../lib/d1";

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

export async function DELETE(request, { params }) {
  try {
    // Defense-in-depth authorization check directly in route handler
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access: Passcode required" }, { status: 401 });
    }

    const identifier = params.id;
    if (!identifier) {
      return NextResponse.json({ error: "Invalid folder identifier" }, { status: 400 });
    }

    await deleteFolder(identifier);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to delete folder" }, { status: 500 });
  }
}
