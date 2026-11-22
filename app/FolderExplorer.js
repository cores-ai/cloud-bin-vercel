"use client";

import { useState } from "react";
import Link from "next/link";

export default function FolderExplorer({ initialFolders = [], error = "" }) {
  const [folders, setFolders] = useState(initialFolders);
  const [search, setSearch] = useState("");
  const [deletingSlug, setDeletingSlug] = useState(null);

  // Status Editor Modal State
  const [editingFolder, setEditingFolder] = useState(null);
  const [editSale, setEditSale] = useState("unsold");
  const [editWork, setEditWork] = useState("pending");
  const [savingStatus, setSavingStatus] = useState(false);

  const filtered = folders.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.email.toLowerCase().includes(q) ||
      f.folder_label.toLowerCase().includes(q) ||
      (f.author && f.author.toLowerCase().includes(q)) ||
      (f.sale_status && f.sale_status.toLowerCase().includes(q)) ||
      (f.work_status && f.work_status.toLowerCase().includes(q)) ||
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

  const openStatusEditor = (e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingFolder(folder);
    setEditSale(folder.sale_status || "unsold");
    setEditWork(folder.work_status || "pending");
  };

  const closeStatusEditor = () => {
    setEditingFolder(null);
  };

  const saveStatusChanges = async () => {
    if (!editingFolder) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/folder/${encodeURIComponent(editingFolder.folder_slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sale_status: editSale,
          work_status: editWork,
        }),
      });

      if (res.ok) {
        setFolders((prev) =>
          prev.map((item) =>
            item.folder_slug === editingFolder.folder_slug
              ? { ...item, sale_status: editSale, work_status: editWork }
              : item
          )
        );
        closeStatusEditor();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update status.");
      }
    } catch {
      alert("Network error while updating status.");
    } finally {
      setSavingStatus(false);
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
            placeholder="filter by email / date / status / author..."
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
          const author = folder.author || "A";
          const isSold = folder.sale_status === "sold";
          const isComplete = folder.work_status === "complete";

          return (
            <Link
              href={`/f/${folder.folder_slug}`}
              className="folder-card"
              key={folder.folder_slug}
            >
              {/* Folder Tab Header Bar with Domain, Author & Statuses */}
              <div className="folder-tab-bar">
                <div className="folder-tab-left">
                  <span className="domain-pill" title={folder.email}>
                    #{numId} {domain || "folder"}
                  </span>
                  {/* Uploader Name Tag (A, P, AP) */}
                  <span className="author-badge" title={`Document Uploader: ${author}`}>
                    {author}
                  </span>
                </div>

                {/* Right Tab Status Chips (Clickable to Edit) */}
                <div className="folder-tab-right" onClick={(e) => openStatusEditor(e, folder)} title="Click to change status">
                  <span className={`status-pill sale-pill ${isSold ? "pill-sold" : "pill-unsold"}`}>
                    {isSold ? "SOLD" : "UNSOLD"}
                  </span>
                  <span className={`status-pill work-pill ${isComplete ? "pill-complete" : "pill-pending"}`}>
                    {isComplete ? "DONE" : "PENDING"}
                  </span>
                </div>
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

                {/* Folder Footer with Mini Delete & Status Edit Buttons */}
                <div className="folder-meta">
                  <span className="time-badge">
                    {folder.date_ist} &bull; {folder.time_ist} IST
                  </span>
                  
                  <div className="meta-actions">
                    <button
                      className="mini-edit-btn"
                      onClick={(e) => openStatusEditor(e, folder)}
                      title="Edit Sale & Processing Status"
                    >
                      ✎ Edit
                    </button>
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

      {/* Status Editor Modal (Save / Discard) */}
      {editingFolder ? (
        <div className="status-modal-backdrop" onClick={closeStatusEditor}>
          <div className="status-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">[STATUS_SETTINGS]</div>
              <button className="modal-close-btn" onClick={closeStatusEditor}>✕</button>
            </div>

            <div className="modal-sub">
              Target: <code>{editingFolder.folder_label || editingFolder.email}</code>
            </div>

            {/* Author (Read Only / Locked) */}
            <div className="modal-field">
              <label className="field-label">
                UPLOADER <span>(Locked at intake)</span>
              </label>
              <div className="locked-author-box">
                <span className="author-badge-large">{editingFolder.author || "A"}</span>
                <span className="locked-note">🔒 Set at Telegram Intake (Immutable)</span>
              </div>
            </div>

            {/* Sale Status Toggle */}
            <div className="modal-field">
              <label className="field-label">SALE STATUS</label>
              <div className="toggle-btn-group">
                <button
                  type="button"
                  className={`toggle-option ${editSale === "unsold" ? "opt-active unsold-active" : ""}`}
                  onClick={() => setEditSale("unsold")}
                >
                  🏷️ Unsold
                </button>
                <button
                  type="button"
                  className={`toggle-option ${editSale === "sold" ? "opt-active sold-active" : ""}`}
                  onClick={() => setEditSale("sold")}
                >
                  💰 Sold
                </button>
              </div>
            </div>

            {/* Processing Status Toggle */}
            <div className="modal-field">
              <label className="field-label">PROCESSING STATUS</label>
              <div className="toggle-btn-group">
                <button
                  type="button"
                  className={`toggle-option ${editWork === "pending" ? "opt-active pending-active" : ""}`}
                  onClick={() => setEditWork("pending")}
                >
                  ⏳ Pending
                </button>
                <button
                  type="button"
                  className={`toggle-option ${editWork === "complete" ? "opt-active complete-active" : ""}`}
                  onClick={() => setEditWork("complete")}
                >
                  ✅ Complete
                </button>
              </div>
            </div>

            {/* Action Buttons: Save & Discard */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-discard"
                onClick={closeStatusEditor}
                disabled={savingStatus}
              >
                Discard
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={saveStatusChanges}
                disabled={savingStatus}
              >
                {savingStatus ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
