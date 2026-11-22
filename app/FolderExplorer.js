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
      {/* Search & Prompt Filter */}
      <div className="controls">
        <div className="search-wrap">
          <span className="prompt-prefix">&gt;</span>
          <input
            type="text"
            className="search-input"
            placeholder="filter --email / --domain / --date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search ? (
            <button className="clear-btn" onClick={() => setSearch("")}>
              [x]
            </button>
          ) : null}
        </div>
        <div className="count-tag">
          [MATCH: {filtered.length}/{initialFolders.length}]
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon">[NO_DATA]</div>
          <h3>{search ? "QUERY RETURNED 0 MATCHES" : "NO ARCHIVES DETECTED"}</h3>
          <p>
            {search
              ? "No directory matches search criteria. Clear filter to see all records."
              : "Awaiting Telegram bot intake. Forward 2 photos and an email to generate a folder."}
          </p>
        </div>
      ) : null}

      {/* Grid of Folders */}
      <section className="grid">
        {filtered.map((folder, index) => {
          const emailParts = folder.email.split("@");
          const username = emailParts[0];
          const domain = emailParts[1] ? `@${emailParts[1]}` : "";
          const hexId = (index + 1).toString(16).padStart(2, "0").toUpperCase();

          return (
            <Link
              href={`/f/${folder.folder_slug}`}
              className="folder-card"
              key={folder.id}
            >
              {/* Folder Terminal Tab */}
              <div className="folder-tab">
                <span className="domain-pill" title={folder.email}>
                  #{hexId} {domain || "DIR"}
                </span>
              </div>

              {/* Photos Peeking / Radar Display */}
              <div className="folder-pocket">
                <div className="preview-polaroids">
                  {folder.photoIds && folder.photoIds.length > 0 ? (
                    <>
                      <div className="polaroid pic-left">
                        <img
                          src={`/api/photo/${folder.photoIds[0]}`}
                          alt="Feed 1"
                          loading="lazy"
                        />
                      </div>
                      {folder.photoIds[1] ? (
                        <div className="polaroid pic-right">
                          <img
                            src={`/api/photo/${folder.photoIds[1]}`}
                            alt="Feed 2"
                            loading="lazy"
                          />
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="empty-pocket">[FEED_OFFLINE]</div>
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
                  <span className="photo-count-pill">2_PICS</span>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
