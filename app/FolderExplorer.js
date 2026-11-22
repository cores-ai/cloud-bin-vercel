"use client";

import { useState } from "react";
import Link from "next/link";

export default function FolderExplorer({ initialFolders = [] }) {
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
      {/* Search & Filter Bar */}
      <div className="controls">
        <div className="search-wrap">
          <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search folders by email, name or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search ? (
            <button className="clear-btn" onClick={() => setSearch("")}>
              ✕
            </button>
          ) : null}
        </div>
        <div className="count-tag">
          {filtered.length} of {initialFolders.length} Folders
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon">📁</div>
          <h3>{search ? "No matching folders found" : "No folders created yet"}</h3>
          <p>
            {search
              ? "Try searching for a different email address or domain."
              : "Send 2 photos and an email to your Telegram Bot. They will automatically organize into folders here!"}
          </p>
        </div>
      ) : null}

      {/* Grid of Folders */}
      <section className="grid">
        {filtered.map((folder) => {
          // Smart formatting: handle mailbox and domain separation
          const emailParts = folder.email.split("@");
          const username = emailParts[0];
          const domain = emailParts[1] ? `@${emailParts[1]}` : "";

          return (
            <Link
              href={`/f/${folder.folder_slug}`}
              className="folder-card"
              key={folder.id}
            >
              {/* Folder Physical Tab */}
              <div className="folder-tab">
                <span className="domain-pill" title={folder.email}>
                  {domain || "folder"}
                </span>
              </div>

              {/* Photos Peeking Preview */}
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

              {/* Folder Content / Metadata */}
              <div className="folder-body">
                <div className="folder-title" title={folder.email}>
                  {folder.folder_label || username}
                </div>

                {/* Smart full email display */}
                <div className="email-chip" title={folder.email}>
                  <span className="at-icon">@</span>
                  <span className="email-text">{folder.email}</span>
                </div>

                <div className="folder-meta">
                  <span className="time-badge">
                    🕒 {folder.date_ist} &bull; {folder.time_ist} IST
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
