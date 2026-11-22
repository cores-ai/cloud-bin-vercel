"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PhotoGallery({ photos = [], email = "", folderSlug = null }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  return (
    <div className="gallery-section">
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
    </div>
  );
}
