"use client";

import { useState } from "react";
import Link from "next/link";

export default function FolderExplorer({ initialFolders = [], error = "" }) {
  const [search, setSearch] = useState("");

  const filtered = initialFolders.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.email.toLowerCase().includes(q) ||
      f.folder_label.toLowerCase().includes(q) ||
      (f.date_ist && f.date_ist.toLowerCase().includes(q))
    );
  });

  return (
    <div className="explorer">
      {/* Top Header */}
      <header className="top">
        {/* Left side on mobile / top-left on desktop */}
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

        {/* Right side on mobile: Title, Archived count, and Search Match count directly underneath */}
        <div className="header-title-block">
          <h1>Photo Vault Folders</h1>
          <p>{initialFolders.length} archived folder{initialFolders.length === 1 ? "" : "s"}</p>
          <div className="count-tag-mobile">
            {filtered.length} of {initialFolders.length} folders
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
        {/* Desktop count tag stays next to search bar on desktop only */}
        <div className="count-tag desktop-only">
          {filtered.length} of {initialFolders.length} folders
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
              key={folder.id}
            >
              {/* Folder Tab Header */}
              <div className="folder-tab">
                <span className="domain-pill" title={folder.email}>
                  #{numId} {domain || "folder"}
                </span>
              </div>

              {/* Photos Peeking / Preview */}
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

                <div className="folder-meta">
                  <span className="time-badge">
                    {folder.date_ist} &bull; {folder.time_ist} IST
                  </span>
                  <span className="photo-count-pill">2 Pics</span>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
