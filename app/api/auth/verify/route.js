import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SECRET = process.env.AUTH_SECRET || "momo_nuclear_vault_secret_key_8844";

async function computeHash(passcode) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`vault:${passcode}`));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const providedPasscode = (body.passcode || "").trim();

    const expectedPasscode = (
      process.env.APP_PASSCODE ||
      process.env.PASSCODE ||
      ""
    ).trim();

    // Constant-time check / defense
    if (!expectedPasscode) {
      return NextResponse.json({ error: "No passcode configured on server" }, { status: 500 });
    }

    if (providedPasscode !== expectedPasscode) {
      // Artificial delay to prevent brute-force timing attacks
      await new Promise((r) => setTimeout(r, 450));
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }

    const sessionHash = await computeHash(expectedPasscode);

    const isProduction = process.env.NODE_ENV === "production";

    const response = NextResponse.json({ success: true });

    // Store in cookie for 1 full year (31,536,000 seconds)
    response.cookies.set("vault_session", sessionHash, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/",
      maxAge: 31536000, // 365 days
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
