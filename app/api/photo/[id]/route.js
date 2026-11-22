import { photoBytes } from "../../../../lib/d1";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request, { params }) {
  if (!/^\d+$/.test(params.id || "")) {
    return new Response("Not found", { status: 404 });
  }
  const row = await photoBytes(params.id);
  if (!row?.image_base64) {
    return new Response("Not found", { status: 404 });
  }
  const bytes = Buffer.from(row.image_base64, "base64");
  return new Response(bytes, {
    headers: {
      "Content-Type": row.mime_type || "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
