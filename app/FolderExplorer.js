"use client";

import { useState } from "react";
import Link from "next/link";

export default function FolderExplorer({ initialFolders = [], error = "" }) {
  const [folders, setFolders] = useState(initialFolders);
  const [search, setSearch] = useState("");
  const [deletingSlug, setDeletingSlug] = useState(null);

  const filtered = folders.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.email.toLowerCase().includes(q) ||
      f.folder_label.toLowerCase().includes(q) ||
      (f.date_ist && f.date_ist.toLowerCase().includes(q))
    );
  });

  const handleDelete = async (e, slug, email) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Delete folder for "${email}" and all its photos?`)) {
      return;
    }

    setDeletingSlug(slug);
    try {
      const res = await fetch(`/api/folder/${encodeURIComponent(slug)}`, { method: "DELETE" });
      if (res.ok) {
        setFolders((prev) => prev.filter((item) => item.folder_slug !== slug));
      } else {
        alert("Failed to delete folder. Check server credentials.");
      }
    } catch {
      alert("Network error while deleting folder.");
    } finally {
      setDeletingSlug(null);
    }
  };

  return (
    <div className="explorer">
      {/* Top Header */}
      <header className="top">
        <div className="header-meta-side">
          <div className="terminal-brand">
            <span>Cloud Bin</span>
            <span className="morse-code">&bull;&bull;&bull; &mdash;&mdash;&mdash; &bull;&bull;&bull;</span>
          </div>
          <div className="sys-status-badge">
            <span className="status-blink" />
            <span>Active (IST)</span>
          </div>
        </div>

        <div className="header-title-block">
          <h1>Photo Vault Folders</h1>
          <p>{folders.length} archived folder{folders.length === 1 ? "" : "s"}</p>
          <div className="count-tag-mobile">
            {filtered.length} of {folders.length} folders
          </div>
        </div>
      </header>

      {error ? (
        <div className="warn-card">
          <h3>[DATABASE_NOTICE]</h3>
          <p>{error}</p>
        </div>
      ) : null}

      {/* Search & Prompt Filter */}
      <div className="controls">
        <div className="search-wrap">
          <span className="prompt-prefix">&gt;</span>
          <input
            type="text"
            className="search-input"
            placeholder="filter folders by email / date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search ? (
            <button className="clear-btn" onClick={() => setSearch("")} title="Clear search">
              ✕
            </button>
          ) : null}
        </div>
        <div className="count-tag desktop-only">
          {filtered.length} of {folders.length} folders
        </div>
      </div>

      {/* Clean, Subtle Empty Indicator */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-dot" />
          <span className="empty-text">
            {search
              ? "No folders matching search filter."
              : "No folders recorded yet. Send 2 photos and an email to your Telegram bot."}
          </span>
        </div>
      ) : null}

      {/* Grid of Folders */}
      <section className="grid">
        {filtered.map((folder, index) => {
          const emailParts = folder.email.split("@");
          const username = emailParts[0];
          const domain = emailParts[1] ? `@${emailParts[1]}` : "";
          const numId = (index + 1).toString().padStart(2, "0");

          return (
            <Link
              href={`/f/${folder.folder_slug}`}
              className="folder-card"
              key={folder.folder_slug}
            >
              {/* Folder Tab Header */}
              <div className="folder-tab">
                <span className="domain-pill" title={folder.email}>
                  #{numId} {domain || "folder"}
                </span>
              </div>

              {/* Photos Peeking / Preview with Signed Tokens */}
              <div className="folder-pocket">
                <div className="preview-polaroids">
                  {folder.photoIds && folder.photoIds.length > 0 ? (
                    <>
                      <div className="polaroid pic-left">
                        <img
                          src={`/api/photo/${folder.photoIds[0]}`}
                          alt="Photo 1"
                          loading="lazy"
                        />
                      </div>
                      {folder.photoIds[1] ? (
                        <div className="polaroid pic-right">
                          <img
                            src={`/api/photo/${folder.photoIds[1]}`}
                            alt="Photo 2"
                            loading="lazy"
                          />
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="empty-pocket">2 Photos</div>
                  )}
                </div>
              </div>

              {/* Folder Metadata Body */}
              <div className="folder-body">
                <div className="folder-title" title={folder.email}>
                  {folder.folder_label || username}
                </div>

                {/* Monospace Email Tag */}
                <div className="email-chip" title={folder.email}>
                  <span className="at-icon">@</span>
                  <span className="email-text">{folder.email}</span>
                </div>

                {/* Folder Footer with Mini Delete Button */}
                <div className="folder-meta">
                  <span className="time-badge">
                    {folder.date_ist} &bull; {folder.time_ist} IST
                  </span>
                  
                  <div className="meta-actions">
                    <span className="photo-count-pill">2 Pics</span>
                    <button
                      className="mini-del-btn"
                      onClick={(e) => handleDelete(e, folder.folder_slug, folder.email)}
                      title="Delete this folder"
                      disabled={deletingSlug === folder.folder_slug}
                    >
                      {deletingSlug === folder.folder_slug ? "..." : (
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                          <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
