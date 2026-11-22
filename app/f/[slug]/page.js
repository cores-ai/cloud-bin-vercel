import { notFound } from "next/navigation";
import Link from "next/link";
import { config, folderBySlug } from "../../../lib/d1";
import PhotoGallery from "./PhotoGallery";

export const dynamic = "force-dynamic";

export default async function FolderPage({ params }) {
  if (!config()) {
    return (
      <main className="wrap">
        <div className="warn-card">[ERR_CONFIG] Cloudflare D1 environment variables missing on Vercel.</div>
      </main>
    );
  }

  const slug = params?.slug;
  // Security validation: ensure slug contains only safe characters
  if (!slug || !/^[a-z0-9_-]+$/i.test(slug)) {
    notFound();
  }

  const folder = await folderBySlug(slug);
  if (!folder) notFound();

  return (
    <main className="wrap">
      <div className="top-nav">
        <Link href="/" className="back-btn">
          &larr; Back to all folders
        </Link>
      </div>

      <section className="folder-detail-container">
        {/* Folder Header Card */}
        <div className="folder-header-card">
          <div className="header-meta">
            <div className="terminal-brand">
              <span>[DIR_INSPECT]</span>
            </div>
            <h1 className="header-title">{folder.folder_label}</h1>

            <div className="email-box">
              <span>Email: </span>
              <span className="email-display">{folder.email}</span>
            </div>

            <div className="time-stamp-box">
              <span>🕒 Created: {folder.date_ist} at {folder.time_ist} IST</span>
              <span className="sep">&bull;</span>
              <span>Cloud Bin</span>
            </div>
          </div>
        </div>

        {/* 2 Stored High-Res Photographs */}
        <PhotoGallery photos={folder.photos} email={folder.email} folderSlug={folder.folder_slug} />
      </section>
    </main>
  );
}
