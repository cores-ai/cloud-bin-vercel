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

  const folder = await folderBySlug(params.slug);
  if (!folder) notFound();

  return (
    <main className="wrap">
      <div className="top-nav">
        <Link href="/" className="back-btn">
          &lt;-- RETURN_TO_ROOT // ALL_FOLDERS
        </Link>
      </div>

      <section className="folder-detail-container">
        {/* Terminal Folder Header */}
        <div className="folder-header-card">
          <div className="header-meta">
            <div className="terminal-brand">
              <span>[DIR_INSPECT]</span>
              <span className="morse-code">.. -. ... .--. . -.-. -</span>
            </div>
            <h1 className="header-title">{folder.folder_label}</h1>
            
            <div className="email-box">
              <span>TARGET_MAIL: </span>
              <span className="email-display">{folder.email}</span>
            </div>

            <div className="time-stamp-box">
              <span>TIMESTAMP: {folder.date_ist} // {folder.time_ist} IST</span>
              <span className="sep">&bull;</span>
              <span>STORAGE: CLOUDFLARE_D1 [doc-dustbin]</span>
            </div>
          </div>
        </div>

        {/* 2 Stored High-Res Photographs */}
        <PhotoGallery photos={folder.photos} email={folder.email} />
      </section>
    </main>
  );
}
