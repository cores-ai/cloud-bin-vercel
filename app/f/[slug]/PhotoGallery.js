"use client";

import { useState } from "react";

export default function PhotoGallery({ photos = [], email = "" }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="gallery-section">
      <div className="gallery-toolbar">
        <div className="toolbar-left">
          <h2>2 Stored Photos</h2>
          <p>Preserved in Cloudflare D1 storage</p>
        </div>
        <button className="copy-action-btn" onClick={copyEmail}>
          {copied ? "✓ Copied" : "📋 Copy Email"}
        </button>
      </div>

      <div className="photos-grid">
        {photos.map((photo, index) => {
          const photoUrl = `/api/photo/${photo.id}`;
          const picNum = photo.position || index + 1;
          return (
            <div className="photo-card" key={photo.id}>
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
