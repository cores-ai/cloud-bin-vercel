import { NextResponse } from "next/server";
import { deleteFolderById } from "../../../../lib/d1";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(_request, { params }) {
  try {
    const id = params.id;
    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ error: "Invalid folder ID" }, { status: 400 });
    }

    await deleteFolderById(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to delete folder" }, { status: 500 });
  }
}
