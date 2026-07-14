import React, { useEffect, useState } from "react";
import { message } from "antd";
import {
  newsService,
  type NewsDTO,
  sanitizeNewsData,
  base64ToBlobUrl,
} from "../services/NewsService";

// ---------- Local types ----------

interface NewsCard {
  localId: string; // stable React key, independent of server newsId
  newsId: number | null;
  news: string;
  file: File | null; // a newly picked file, not yet saved
  existingNewsData: string | null; // raw, VALIDATED base64 (no data: prefix); null if unavailable/unreliable
  saving: boolean;
  deleting: boolean;
  error: string | null;
  savedAt: number | null; // timestamp, just to flash a "Saved" state briefly
  newsDescription: string;
}

const makeLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyCard = (): NewsCard => ({
  localId: makeLocalId(),
  newsId: null,
  news: "",
  file: null,
  existingNewsData: null,
  saving: false,
  deleting: false,
  error: null,
  savedAt: null,
  newsDescription: "", // NEW
});

const dtoToCard = (dto: NewsDTO): NewsCard => ({
  localId: makeLocalId(),
  newsId: dto.newsId ?? null,
  news: dto.news ?? "",
  newsDescription: dto.newsDescription ?? "", // NEW
  file: null,
  existingNewsData: sanitizeNewsData(dto.newsData),
  saving: false,
  deleting: false,
  error: null,
  savedAt: null,
});

const fileLabel = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "Photo";
  if (ext === "pdf") return "PDF";
  return "File";
};

/** Pulls a usable message off an axios-style error, falling back to a generic one. */
const extractErrorMessage = (err: any, fallback: string): string =>
  err?.response?.data?.message || err?.message || fallback;

const EventsAndNewsAdmin: React.FC = () => {
  const [cards, setCards] = useState<NewsCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cardPendingDelete, setCardPendingDelete] = useState<NewsCard | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const loadNews = async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await newsService.getAllNews(0, 50, signal);
      const list = res?.data?.newsDTOS ?? [];
      setCards(list.length ? list.map(dtoToCard) : [emptyCard()]);
      setCurrentPage(1);
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
        // request was aborted (e.g. StrictMode's double-invoke, or a fast unmount) — not a real error
        return;
      }
      setLoadError("Couldn't load news. Please refresh and try again.");
      setCards([emptyCard()]);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadNews(controller.signal);
    return () => controller.abort();
  }, []);

  const updateCard = (localId: string, patch: Partial<NewsCard>) => {
    setCards((prev) => prev.map((c) => (c.localId === localId ? { ...c, ...patch } : c)));
  };

  const handleAddNew = () => {
    setCards((prev) => {
      const next = [...prev, emptyCard()];
      setCurrentPage(Math.ceil(next.length / pageSize));
      return next;
    });
  };

  const handleFileChange = (localId: string, fileList: FileList | null) => {
    const file = fileList && fileList.length > 0 ? fileList[0] : null;
    updateCard(localId, { file, error: null });
  };

  const handlePreview = (card: NewsCard) => {
    if (card.file) {
      const objectUrl = URL.createObjectURL(card.file);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      return;
    }
    if (card.existingNewsData) {
      const blobUrl = base64ToBlobUrl(card.existingNewsData);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } else {
      message.warning("This attachment can't be previewed. Try re-uploading the file.");
    }
  };

  const handleSave = async (card: NewsCard) => {
    if (!card.news.trim()) {
      updateCard(card.localId, { error: "News name is required." });
      return;
    }
    updateCard(card.localId, { saving: true, error: null });
    try {
      if (card.newsId == null) {
        const res = await newsService.saveNews(card.news.trim(), card.file, card.newsDescription.trim());
        if (!res?.success) {
          throw new Error(res?.message || "Save failed. Please try again.");
        }
        setCards((prev) => {
          const saved: NewsCard = {
            ...card,
            saving: false,
            newsId: res.data?.newsId ?? null,
            existingNewsData: sanitizeNewsData(res.data?.newsData) ?? res.sentNewsData ?? card.existingNewsData,
            file: null,
            savedAt: Date.now(),
          };
          const rest = prev.filter((c) => c.localId !== card.localId);
          return [saved, ...rest];
        });
        setCurrentPage(1);
        message.success(res.message || "News saved successfully");
      } else {
        const res = await newsService.updateNews(card.newsId, card.news.trim(), card.file, card.existingNewsData, card.newsDescription);
        if (!res?.success) {
          throw new Error(res?.message || "Update failed. Please try again.");
        }
        updateCard(card.localId, {
          saving: false,
          existingNewsData: sanitizeNewsData(res.data?.newsData) ?? res.sentNewsData ?? card.existingNewsData,
          file: null,
          savedAt: Date.now(),
        });
        message.success(res.message || "News updated successfully");
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err, "Save failed. Please try again.");
      updateCard(card.localId, { saving: false, error: errorMessage });
      message.error(errorMessage);
    }
  };

  const handleRemoveClick = (card: NewsCard) => {
    if (card.newsId == null) {
      // never saved — nothing for the backend to confirm, just drop it locally
      setCards((prev) => prev.filter((c) => c.localId !== card.localId));
      return;
    }
    setCardPendingDelete(card);
  };

  const confirmDelete = async () => {
    const card = cardPendingDelete;
    if (!card || card.newsId == null) return;
    updateCard(card.localId, { deleting: true, error: null });
    try {
      const res = await newsService.deleteNews(card.newsId);
      setCards((prev) => prev.filter((c) => c.localId !== card.localId));
      message.success(res?.message || "News deleted successfully");
    } catch (err) {
      const errorMessage = extractErrorMessage(err, "Delete failed. Please try again.");
      updateCard(card.localId, { deleting: false, error: errorMessage });
      message.error(errorMessage);
    } finally {
      setCardPendingDelete(null);
    }
  };

  return (
    <div className="ena-page">
      <style>{`
        .ena-page {
          font-family: 'Segoe UI', 'Inter', system-ui, -apple-system, sans-serif;
          background: #F4F5F7;
          min-height: 100%;
          padding: 32px 24px;
          color: #1B2A4A;
          position: relative;
        }
        .ena-header {
          max-width: 880px;
          margin: 0 auto 20px;
        }
        .ena-header h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 4px;
          color: #1B2A4A;
        }
        .ena-header p {
          margin: 0;
          font-size: 14px;
          color: #667085;
        }
        .ena-wrapper {
          max-width: 880px;
          margin: 0 auto;
          border: 1px solid #E1E4EA;
          border-radius: 16px;
          background: #FBFBFA;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(27, 42, 74, 0.06);
        }
        .ena-load-error {
          background: #FDECEC;
          border: 1px solid #F3B7B7;
          color: #C0392B;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 16px;
        }
        .ena-loading {
          text-align: center;
          color: #667085;
          padding: 40px 0;
          font-size: 14px;
        }
        .ena-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .ena-card {
          background: #FFFFFF;
          border: 1px solid #E1E4EA;
          border-radius: 12px;
          padding: 18px 20px;
          transition: box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .ena-card:hover {
          box-shadow: 0 2px 10px rgba(27, 42, 74, 0.07);
          border-color: #D6DAE3;
        }
        .ena-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .ena-card-badge {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 3px 9px;
          border-radius: 999px;
          background: #EFF2F6;
          color: #667085;
        }
        .ena-card-badge.is-new {
          background: #FCF3E3;
          color: #B7791F;
        }
        .ena-card-badge.is-saved {
          background: #E7F5EC;
          color: #2F855A;
        }
        .ena-card-badge.is-top {
          background: #E7F5EC;
          color: #2F855A;
        }
        .ena-field-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #667085;
          margin-bottom: 6px;
        }
        .ena-input {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 12px;
          border: 1px solid #D6DAE3;
          border-radius: 8px;
          font-size: 14px;
          color: #1B2A4A;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .ena-input:focus {
          border-color: #1B2A4A;
        }
        .ena-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 14px;
        }
        @media (max-width: 620px) {
          .ena-row { grid-template-columns: 1fr; }
        }
        .ena-file-zone {
          border: 1px dashed #D6DAE3;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .ena-file-input-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          color: #1B2A4A;
          font-weight: 600;
          font-size: 13px;
        }
        .ena-file-input-label input {
          display: none;
        }
        .ena-file-chip {
          font-size: 12px;
          color: #667085;
          background: #F4F5F7;
          border-radius: 6px;
          padding: 3px 8px;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ena-file-preview-link {
          border: none;
          background: none;
          color: #1B4AB0;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          text-decoration: underline;
          padding: 0;
        }
        .ena-file-clear {
          border: none;
          background: none;
          color: #C0392B;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }
        .ena-card-error {
          color: #C0392B;
          font-size: 12px;
          margin-top: 8px;
        }
        .ena-card-actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }
        .ena-btn {
          border: none;
          border-radius: 8px;
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.05s ease;
        }
        .ena-btn:active {
          transform: translateY(1px);
        }
        .ena-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .ena-btn-save {
          background: #1B2A4A;
          color: #FFFFFF;
        }
        .ena-btn-save:hover:not(:disabled) {
          background: #243759;
        }
        .ena-btn-remove {
          background: #FFFFFF;
          color: #C0392B;
          border: 1px solid #F0C2C2;
        }
        .ena-btn-remove:hover:not(:disabled) {
          background: #FDECEC;
        }
        .ena-add-btn {
          width: 100%;
          margin-top: 18px;
          padding: 12px;
          border: 1.5px dashed #C9972F;
          border-radius: 10px;
          background: #FCF8F0;
          color: #B7791F;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .ena-add-btn:hover {
          background: #FBF1DC;
        }

        .ena-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 18px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .ena-pagination-count {
          font-size: 13px;
          color: #667085;
        }
        .ena-pagination-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ena-page-btn {
          border: 1px solid #D6DAE3;
          background: #FFFFFF;
          color: #1B2A4A;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .ena-page-btn:hover:not(:disabled) {
          background: #F4F5F7;
          border-color: #C4CAD6;
        }
        .ena-page-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .ena-page-btn.is-active {
          background: #1B2A4A;
          border-color: #1B2A4A;
          color: #FFFFFF;
        }

        /* Delete confirmation modal */
        .ena-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(27, 42, 74, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
          padding: 16px;
        }
        .ena-modal {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 24px;
          width: 100%;
          max-width: 380px;
          box-shadow: 0 12px 32px rgba(27, 42, 74, 0.22);
        }
        .ena-modal h3 {
          margin: 0 0 8px;
          font-size: 16px;
          color: #1B2A4A;
        }
        .ena-modal p {
          margin: 0 0 20px;
          font-size: 14px;
          color: #667085;
        }
        .ena-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .ena-btn-cancel {
          background: #F4F5F7;
          color: #1B2A4A;
        }
        .ena-btn-cancel:hover:not(:disabled) {
          background: #EAECEF;
        }
        .ena-btn-danger {
          background: #C0392B;
          color: #FFFFFF;
        }
        .ena-btn-danger:hover:not(:disabled) {
          background: #A5301F;
        }
      `}</style>

      <div className="ena-header">
        <h1>Add News</h1>
      </div>

      <div className="ena-wrapper">
        {loadError && <div className="ena-load-error">{loadError}</div>}

        {loading ? (
          <div className="ena-loading">Loading news…</div>
        ) : (
          <div className="ena-cards">
            {cards
              .slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize)
              .map((card, i) => {
                const index = (currentPage - 1) * pageSize + i;
                const isNew = card.newsId == null;
                const justSaved = card.savedAt && Date.now() - card.savedAt < 4000;
                const hasAttachment = Boolean(card.file || card.existingNewsData);
                const isFirstThree = index < 3;
                const badgeLabel = isNew ? "New" : justSaved ? "Saved" : isFirstThree ? "New" : null;
                const badgeClass = isNew ? "is-new" : justSaved ? "is-saved" : isFirstThree ? "is-top" : "";
                return (
                  <div className="ena-card" key={card.localId}>
                    <div className="ena-card-top">
                      {badgeLabel && <span className={`ena-card-badge ${badgeClass}`}>{badgeLabel}</span>}
                    </div>

                    <div className="ena-row">
                      <div>
                        <label className="ena-field-label">News name</label>
                        <input
                          className="ena-input"
                          type="text"
                          placeholder="e.g. Sports notice"
                          value={card.news}
                          onChange={(e) => updateCard(card.localId, { news: e.target.value, error: null })}
                        />
                      </div>
                      <div>
                        <label className="ena-field-label">Attachment (PDF, photo, or any file)</label>
                        <div className="ena-file-zone">
                          <label className="ena-file-input-label">
                            📎 Choose file
                            <input
                              type="file"
                              onChange={(e) => handleFileChange(card.localId, e.target.files)}
                            />
                          </label>
                          {card.file ? (
                            <span className="ena-file-chip" title={card.file.name}>
                              {fileLabel(card.file.name)}: {card.file.name}
                            </span>
                          ) : card.existingNewsData ? (
                            <span className="ena-file-chip">File attached</span>
                          ) : (
                            <span className="ena-file-chip">No file selected</span>
                          )}
                          {hasAttachment && (
                            <button className="ena-file-preview-link" onClick={() => handlePreview(card)}>
                              Preview
                            </button>
                          )}
                          {card.file && (
                            <button
                              className="ena-file-clear"
                              onClick={() => updateCard(card.localId, { file: null })}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label className="ena-field-label">Description</label>
                        <textarea
                          className="ena-input"
                          rows={3}
                          placeholder="Add any extra details for this news item…"
                          value={card.newsDescription}
                          onChange={(e) => updateCard(card.localId, { newsDescription: e.target.value, error: null })}
                          style={{ resize: "vertical", fontFamily: "inherit" }}
                        />
                      </div>
                    </div>

                    {card.error && <div className="ena-card-error">{card.error}</div>}

                    <div className="ena-card-actions">
                      <button
                        className="ena-btn ena-btn-save"
                        onClick={() => handleSave(card)}
                        disabled={card.saving || card.deleting}
                      >
                        {card.saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        className="ena-btn ena-btn-remove"
                        onClick={() => handleRemoveClick(card)}
                        disabled={card.saving || card.deleting}
                      >
                        {card.deleting ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {!loading && cards.length > pageSize && (
          <div className="ena-pagination">
            <span className="ena-pagination-count">
              Showing {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, cards.length)} of {cards.length}
            </span>
            <div className="ena-pagination-controls">
              <button
                className="ena-page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ‹ Prev
              </button>
              {Array.from({ length: Math.ceil(cards.length / pageSize) }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  className={`ena-page-btn${pageNum === currentPage ? " is-active" : ""}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
              <button
                className="ena-page-btn"
                onClick={() =>
                  setCurrentPage((p) => Math.min(Math.ceil(cards.length / pageSize), p + 1))
                }
                disabled={currentPage === Math.ceil(cards.length / pageSize)}
              >
                Next ›
              </button>
            </div>
          </div>
        )}

        <button className="ena-add-btn" onClick={handleAddNew}>
          + Add New
        </button>
      </div>

      {cardPendingDelete && (
        <div className="ena-modal-backdrop" onClick={() => setCardPendingDelete(null)}>
          <div className="ena-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this news item?</h3>
            <p>
              Are you sure you want to delete "{cardPendingDelete.news || "this event"}"? This can't be
              undone.
            </p>
            <div className="ena-modal-actions">
              <button
                className="ena-btn ena-btn-cancel"
                onClick={() => setCardPendingDelete(null)}
                disabled={cardPendingDelete.deleting}
              >
                Cancel
              </button>
              <button
                className="ena-btn ena-btn-danger"
                onClick={confirmDelete}
                disabled={cardPendingDelete.deleting}
              >
                {cardPendingDelete.deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsAndNewsAdmin;