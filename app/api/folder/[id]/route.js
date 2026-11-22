import { NextResponse } from "next/server";
import { deleteFolder, updateFolderStatus } from "../../../../lib/d1";

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

export async function PATCH(request, { params }) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized access: Passcode required" }, { status: 401 });
    }

    const identifier = params.id;
    if (!identifier) {
      return NextResponse.json({ error: "Invalid folder identifier" }, { status: 400 });
    }

    const body = await request.json();
    const { sale_status, work_status, author } = body;

    // Security & Business Rule: author cannot be modified after intake
    if (author) {
      return NextResponse.json({ error: "Author cannot be edited after initial creation." }, { status: 400 });
    }

    // Validate allowed values
    const validSale = ["sold", "unsold"];
    const validWork = ["pending", "complete"];

    if (sale_status && !validSale.includes(sale_status.toLowerCase())) {
      return NextResponse.json({ error: "Invalid sale_status. Must be 'sold' or 'unsold'." }, { status: 400 });
    }

    if (work_status && !validWork.includes(work_status.toLowerCase())) {
      return NextResponse.json({ error: "Invalid work_status. Must be 'pending' or 'complete'." }, { status: 400 });
    }

    await updateFolderStatus(identifier, {
      sale_status: sale_status ? sale_status.toLowerCase() : undefined,
      work_status: work_status ? work_status.toLowerCase() : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to update folder" }, { status: 500 });
  }
}
