"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PhotoGallery({
  photos = [],
  email = "",
  folderSlug = null,
  initialSale = "unsold",
  initialWork = "pending",
  author = "A",
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Status State
  const [saleStatus, setSaleStatus] = useState(initialSale);
  const [workStatus, setWorkStatus] = useState(initialWork);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [tempSale, setTempSale] = useState(initialSale);
  const [tempWork, setTempWork] = useState(initialWork);
  const [savingStatus, setSavingStatus] = useState(false);

  const router = useRouter();

  const copyEmail = () => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!folderSlug) return;
    if (!window.confirm("Permanently delete this folder and its photos from Cloudflare D1?")) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/folder/${encodeURIComponent(folderSlug)}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        alert("Failed to delete folder.");
        setDeleting(false);
      }
    } catch {
      alert("Network error.");
      setDeleting(false);
    }
  };

  const openEditor = () => {
    setTempSale(saleStatus);
    setTempWork(workStatus);
    setShowModal(true);
  };

  const saveStatus = async () => {
    if (!folderSlug) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/folder/${encodeURIComponent(folderSlug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sale_status: tempSale,
          work_status: tempWork,
        }),
      });
      if (res.ok) {
        setSaleStatus(tempSale);
        setWorkStatus(tempWork);
        setShowModal(false);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update status.");
      }
    } catch {
      alert("Network error updating status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const isSold = saleStatus === "sold";
  const isComplete = workStatus === "complete";

  return (
    <div className="gallery-section">
      {/* Status Bar */}
      <div className="detail-status-bar">
        <div className="status-tags-group">
          <span className="author-badge-large" title={`Document Uploader: ${author}`}>
            UPLOADER: {author}
          </span>
          <span className={`status-pill sale-pill ${isSold ? "pill-sold" : "pill-unsold"}`}>
            {isSold ? "💰 SOLD" : "🏷️ UNSOLD"}
          </span>
          <span className={`status-pill work-pill ${isComplete ? "pill-complete" : "pill-pending"}`}>
            {isComplete ? "✅ DONE" : "⏳ PENDING"}
          </span>
        </div>

        <button className="edit-status-btn" onClick={openEditor} title="Change Sale & Work Status">
          ✎ Edit Status
        </button>
      </div>

      <div className="gallery-toolbar">
        <div className="toolbar-left">
          <h2>2 Stored Photos</h2>
          <p>Preserved in Cloudflare D1 storage</p>
        </div>
        
        <div className="toolbar-actions">
          <button className="copy-action-btn" onClick={copyEmail}>
            {copied ? "✓ Copied" : "📋 Copy Email"}
          </button>
          
          {folderSlug ? (
            <button
              className="delete-action-btn"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete this folder"
            >
              {deleting ? "Deleting..." : "🗑 Delete Folder"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="photos-grid">
        {photos.map((photo, index) => {
          const photoUrl = `/api/photo/${photo.token || photo.id}`;
          const picNum = photo.position || index + 1;
          return (
            <div className="photo-card" key={photo.id || index}>
              <div className="photo-card-top">
                <span className="photo-index">Photo {picNum} of 2</span>
                <a
                  href={photoUrl}
                  download={`photo_${picNum}.jpg`}
                  className="download-link"
                >
                  Download
                </a>
              </div>

              <div
                className="photo-img-wrapper"
                onClick={() => setSelectedPhoto(photoUrl)}
                title="Click to view full screen"
              >
                <img
                  src={photoUrl}
                  alt={`Photograph ${picNum}`}
                  className="photo-img"
                  loading="lazy"
                />
                <div className="zoom-hint">🔍 Expand</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto ? (
        <div className="lightbox-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedPhoto(null)}>
              ✕ Close
            </button>
            <img src={selectedPhoto} alt="Full resolution view" className="lightbox-img" />
          </div>
        </div>
      ) : null}

      {/* Status Editor Modal (Save / Discard) */}
      {showModal ? (
        <div className="status-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="status-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">[STATUS_SETTINGS]</div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-sub">
              Target: <code>{email}</code>
            </div>

            {/* Author (Locked / Immutable) */}
            <div className="modal-field">
              <label className="field-label">
                UPLOADER <span>(Locked at intake)</span>
              </label>
              <div className="locked-author-box">
                <span className="author-badge-large">{author}</span>
                <span className="locked-note">🔒 Set at Telegram Intake (Immutable)</span>
              </div>
            </div>

            {/* Sale Status Toggle */}
            <div className="modal-field">
              <label className="field-label">SALE STATUS</label>
              <div className="toggle-btn-group">
                <button
                  type="button"
                  className={`toggle-option ${tempSale === "unsold" ? "opt-active unsold-active" : ""}`}
                  onClick={() => setTempSale("unsold")}
                >
                  🏷️ Unsold
                </button>
                <button
                  type="button"
                  className={`toggle-option ${tempSale === "sold" ? "opt-active sold-active" : ""}`}
                  onClick={() => setTempSale("sold")}
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
                  className={`toggle-option ${tempWork === "pending" ? "opt-active pending-active" : ""}`}
                  onClick={() => setTempWork("pending")}
                >
                  ⏳ Pending
                </button>
                <button
                  type="button"
                  className={`toggle-option ${tempWork === "complete" ? "opt-active complete-active" : ""}`}
                  onClick={() => setTempWork("complete")}
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
                onClick={() => setShowModal(false)}
                disabled={savingStatus}
              >
                Discard
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={saveStatus}
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
