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
          <h2>BINARY_PAYLOAD // 2_CAPTURES</h2>
          <p>&gt; high_res_blobs preserved in cloudflare d1 doc-dustbin</p>
        </div>
        <button className="copy-action-btn" onClick={copyEmail}>
          {copied ? "[OK: COPIED]" : "[CLIPBOARD: COPY_EMAIL]"}
        </button>
      </div>

      <div className="photos-grid">
        {photos.map((photo, index) => {
          const photoUrl = `/api/photo/${photo.id}`;
          const picNum = photo.position || index + 1;
          return (
            <div className="photo-card" key={photo.id}>
              <div className="photo-card-top">
                <span className="photo-index">[IMG_STREAM #{picNum}/2]</span>
                <a
                  href={photoUrl}
                  download={`capture_${picNum}.jpg`}
                  className="download-link"
                >
                  [GET_BLOB]
                </a>
              </div>

              <div
                className="photo-img-wrapper"
                onClick={() => setSelectedPhoto(photoUrl)}
                title="Inspect in full viewport"
              >
                <img
                  src={photoUrl}
                  alt={`Capture ${picNum}`}
                  className="photo-img"
                  loading="lazy"
                />
                <div className="zoom-hint">[ZOOM_FEED]</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Lightbox Modal */}
      {selectedPhoto ? (
        <div className="lightbox-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedPhoto(null)}>
              [ESC_CLOSE]
            </button>
            <img src={selectedPhoto} alt="Full resolution feed" className="lightbox-img" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
