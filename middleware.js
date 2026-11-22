import { NextResponse } from "next/server";

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

function applySecurityHeaders(response) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; frame-ancestors 'none';"
  );
  return response;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow static assets, next internal files, and the login/verify routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth/verify") ||
    pathname === "/login"
  ) {
    const res = NextResponse.next();
    return applySecurityHeaders(res);
  }

  const expectedPasscode = process.env.APP_PASSCODE || process.env.PASSCODE;

  // If no passcode is configured in env, allow access
  if (!expectedPasscode) {
    const res = NextResponse.next();
    return applySecurityHeaders(res);
  }

  const tokenCookie = request.cookies.get("vault_session");
  const expectedHash = await computeHash(expectedPasscode);

  const isAuthenticated = tokenCookie && tokenCookie.value === expectedHash;

  if (!isAuthenticated) {
    // If requesting photo/folder API without auth, reject directly
    if (pathname.startsWith("/api/")) {
      const res = new NextResponse(
        JSON.stringify({ error: "Unauthorized access: Passcode required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
      return applySecurityHeaders(res);
    }

    // Redirect browser requests to /login
    const loginUrl = new URL("/login", request.url);
    const res = NextResponse.redirect(loginUrl);
    return applySecurityHeaders(res);
  }

  const res = NextResponse.next();
  return applySecurityHeaders(res);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
