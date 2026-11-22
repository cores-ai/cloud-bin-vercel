import { notFound } from "next/navigation";
import Link from "next/link";
import { config, folderBySlug } from "../../../lib/d1";
import PhotoGallery from "./PhotoGallery";

export const dynamic = "force-dynamic";

export default async function FolderPage({ params }) {
  if (!config()) {
    return (
      <main className="wrap">
        <div className="warn-card">Cloudflare D1 environment variables are missing on Vercel.</div>
      </main>
    );
  }

  const folder = await folderBySlug(params.slug);
  if (!folder) notFound();

  return (
    <main className="wrap">
      <div className="top-nav">
        <Link href="/" className="back-btn">
          &larr; Back to All Folders
        </Link>
      </div>

      <section className="folder-detail-container">
        {/* Folder Header */}
        <div className="folder-header-card">
          <div className="header-meta">
            <span className="badge-pill">Archived Folder</span>
            <h1 className="header-title">{folder.folder_label}</h1>
            
            <div className="email-box">
              <span className="email-display">{folder.email}</span>
            </div>

            <div className="time-stamp-box">
              <span>🕒 Created: {folder.date_ist} at {folder.time_ist} IST</span>
              <span className="sep">&bull;</span>
              <span>Cloudflare D1 Storage</span>
            </div>
          </div>
        </div>

        {/* 2 High-Res Photos Display */}
        <PhotoGallery photos={folder.photos} email={folder.email} />
      </section>
    </main>
  );
}
