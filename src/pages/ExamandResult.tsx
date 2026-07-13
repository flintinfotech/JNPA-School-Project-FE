import { useState, useEffect } from "react";
import { message, Spin, Empty } from "antd";
import Alumni from "../assets/alumni.jpg";
import SchoolLogo from "../assets/SchoolLogo.avif";

import {
  getAllExamsByFilter,
  type ExamDTO,
  type ExamResultDTO,
  type ExamNoticeDTO,
  type TopperDTO,
} from "../services/ExamResultService"; // adjust path to match your project structure

// ---------------------------------------------------------------------------
// Filter config - button keys are lowercase for styling, mapped to the exact
// classRoomName / medium casing the backend expects.
// ---------------------------------------------------------------------------
const LEVELS = [
  { key: "pre-primary", label: "Pre-Primary", classRoomName: "Pre-Primary" },
  { key: "primary", label: "Primary", classRoomName: "Primary" },
  { key: "secondary", label: "Secondary", classRoomName: "Secondary" },
];
const MEDIUMS = [
  { key: "english", label: "English Medium", medium: "English" },
  { key: "marathi", label: "Marathi Medium", medium: "Marathi" },
];

// ---------------------------------------------------------------------------
// The list/filter endpoint returns noticeData / resultData as null (file
// bytes aren't sent for list responses). Build a link only when data is
// actually present; otherwise render a disabled indicator instead of a dead
// link. Files here are always PDFs (admin form restricts uploads to .pdf).
// ---------------------------------------------------------------------------
const base64ToPdfUrl = (base64: string): string => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
  return URL.createObjectURL(blob);
};

// Cards per carousel page: 1 on mobile (<=768px), 3 on desktop. Driving the
// pagination math off this (instead of just hiding cards with CSS) means
// each arrow tap on mobile actually advances one topper at a time instead
// of skipping two hidden ones.
function useCardsPerPage() {
  const [cardsPerPage, setCardsPerPage] = useState(() =>
    typeof window !== "undefined" && window.innerWidth <= 768 ? 1 : 3
  );

  useEffect(() => {
    const handleResize = () => {
      setCardsPerPage(window.innerWidth <= 768 ? 1 : 3);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return cardsPerPage;
}

export default function ExamandResult() {
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [activeMedium, setActiveMedium] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState<ExamDTO | null>(null);
  const [searched, setSearched] = useState(false); // true once a fetch has been attempted

  // Single flat carousel over all toppers (no per-standard grouping).
  const [topperPage, setTopperPage] = useState(0);
  const cardsPerPage = useCardsPerPage();
  const [isPaused, setIsPaused] = useState(false);

  // Keep the current page in range whenever the page size changes (resize/rotate).
  useEffect(() => {
    setTopperPage(0);
  }, [cardsPerPage]);

  // Auto-scroll the toppers carousel every 4s, looping back to the start.
  // Pauses while the user hovers the carousel, and does nothing if there's
  // only one page (nothing to advance to).
  useEffect(() => {
    if (isPaused) return;

    const toppers = examData?.toppersDTOS ?? [];
    const totalPages = Math.ceil(toppers.length / cardsPerPage);
    if (totalPages <= 1) return;

    const interval = setInterval(() => {
      setTopperPage((prev) => (prev + 1) % totalPages);
    }, 3000);

    return () => clearInterval(interval);
  }, [examData, cardsPerPage, isPaused]);

  const fetchExamData = async (levelKey: string, mediumKey: string) => {
    const levelConfig = LEVELS.find((l) => l.key === levelKey);
    const mediumConfig = MEDIUMS.find((m) => m.key === mediumKey);
    if (!levelConfig || !mediumConfig) return;

    setLoading(true);
    setSearched(true);
    setTopperPage(0);

    try {
      const res = await getAllExamsByFilter(0, 10, {
        classRoomName: levelConfig.classRoomName,
        medium: mediumConfig.medium as "English" | "Marathi",
      });

      const list: ExamDTO[] = res.data?.data?.examDTOS ?? [];

      // Exact, case-insensitive match on classRoomName AND medium - same
      // reasoning as the admin form: a partial/LIKE backend match could
      // otherwise return the wrong section.
      const existing = list.find((e: any) => {
        const nameMatches =
          (e.classRoomName ?? "").trim().toLowerCase() === levelConfig.classRoomName.trim().toLowerCase();
        if (!nameMatches) return false;
        return (e.medium ?? "").trim().toLowerCase() === mediumConfig.medium.trim().toLowerCase();
      });

      setExamData(existing ?? null);
    } catch {
      message.error("Failed to load exam & result data");
      setExamData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelClick = (levelKey: string) => {
    setActiveLevel(levelKey);
    if (activeMedium) fetchExamData(levelKey, activeMedium);
  };

  const handleMediumClick = (mediumKey: string) => {
    setActiveMedium(mediumKey);
    if (activeLevel) fetchExamData(activeLevel, mediumKey);
  };

  const stats = examData
    ? [
      { label: "Grade X Pass %", value: examData.result10th || "-" },
      { label: "Grade XII Pass %", value: examData.result12th || "-" },
      { label: "Students Scoring 90%+", value: examData.studentScoring90 || "-" },
      { label: "University Rank", value: examData.universityRank || "-" },
    ]
    : [];

  return (
    <div className="results-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", overflowX: "hidden" }}>
      <style>{`
        @media (max-width: 768px) {
          .results-page .results-header-inner {
            padding: 14px 20px 0 !important;
          }
          .results-page .results-header-inner img {
            height: 56px !important;
          }
          .results-page .results-title-wrap {
            padding: 0 20px 18px !important;
          }
          .results-page .results-title-wrap h1 {
            font-size: 26px !important;
          }
          .results-page .results-stats-strip {
            padding: 24px 20px !important;
            gap: 12px !important;
          }
          .results-page .results-stats-strip > div {
            background: rgba(255,255,255,0.35) !important;
            border-radius: 10px !important;
            padding: 14px 6px !important;
          }
          .results-page .results-section {
            padding: 36px 20px !important;
          }
          .results-page .results-section h2 {
            font-size: 20px !important;
            margin-bottom: 18px !important;
          }
          .results-page .results-row {
            flex-direction: column !important;
            gap: 4px !important;
          }
          .results-page .results-row > div:first-child {
            width: auto !important;
          }
          .results-page .results-table-header {
            display: none !important;
          }
          .results-page .results-table-wrap {
            border: none !important;
            overflow: visible !important;
            background: transparent !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
          }
          .results-page .notice-item-row,
          .results-page .examresult-item-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
            padding: 16px !important;
            border-radius: 8px !important;
            background: #fff !important;
            box-shadow: 0 3px 12px rgba(0,0,0,0.07) !important;
          }
          .results-page .notice-item-row {
            border-left: 4px solid #1569ad !important;
          }
          .results-page .examresult-item-row {
            border-left: 4px solid #f5a800 !important;
          }
          .results-page .notice-item-row > div:first-child,
          .results-page .examresult-item-row > div:first-child {
            width: auto !important;
            font-size: 14px !important;
          }
          .results-page .notice-item-row a {
            display: inline-block !important;
            width: auto !important;
          }
          .results-page .examresult-item-row a {
            display: inline-block !important;
          }
          .results-page .toppers-filters button {
            padding: 7px 14px !important;
            font-size: 12px !important;
          }
          .results-page .topper-card {
            padding: 18px !important;
            max-width: 90% !important;
            flex: 1 1 100% !important;
          }
          .results-page .topper-card .topper-avatar {
            width: 64px !important;
            height: 64px !important;
          }
          .results-page .results-banner-overlay {
            padding: 24px 20px !important;
          }
          .results-page .results-banner-img {
            height: 260px !important;
          }
        }

        @media (max-width: 460px) {
          .results-page .results-title-wrap h1 {
            font-size: 22px !important;
          }
          .results-page .toppers-carousel-wrap {
            gap: 8px !important;
          }
          .results-page .topper-card {
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1569ad", position: "relative" }}>
        <div className="results-header-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "18px 40px 0" }}>
          <img src={SchoolLogo} alt="JNPV Logo" style={{ height: "78px", width: "auto", display: "block" }} />
        </div>
        <div className="results-title-wrap" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 26px" }}>
          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 500, margin: 0 }}>Exam and Result</h1>
        </div>
      </div>

      {/* Level + Medium filters - only margin-top/margin-bottom adjusted here */}
      <div style={{ marginTop: "34px", marginBottom: "46px" }}>
        <div className="toppers-filters" style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
          {LEVELS.map((lvl) => (
            <button
              key={lvl.key}
              onClick={() => handleLevelClick(lvl.key)}
              style={{
                padding: "8px 20px",
                borderRadius: "20px",
                border: activeLevel === lvl.key ? "2px solid #1a3a6b" : "1px solid #ccc",
                background: activeLevel === lvl.key ? "#1a3a6b" : "#fff",
                color: activeLevel === lvl.key ? "#fff" : "#1a3a6b",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {lvl.label}
            </button>
          ))}
        </div>
        <div className="toppers-filters" style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          {MEDIUMS.map((med) => (
            <button
              key={med.key}
              onClick={() => handleMediumClick(med.key)}
              style={{
                padding: "6px 18px",
                borderRadius: "20px",
                border: activeMedium === med.key ? "2px solid #f5a800" : "1px solid #ccc",
                background: activeMedium === med.key ? "#f5a800" : "#fff",
                color: activeMedium === med.key ? "#1a3a6b" : "#555",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {med.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt before any filter is selected */}
      {!activeLevel || !activeMedium ? (
        <div style={{ padding: "0 80px 60px", textAlign: "center", color: "#777", fontSize: "14px" }}>
          Select a section and medium above to view exam notices, results, and toppers.
        </div>
      ) : loading ? (
        <div style={{ padding: "60px", textAlign: "center" }}>
          <Spin tip="Loading exam & result data..." />
        </div>
      ) : searched && !examData ? (
        <div style={{ padding: "0 80px 60px" }}>
          <Empty description="No exam & result data published yet for this section and medium." />
        </div>
      ) : (
        examData && (
          <>
            {/* Exam Notices / Notifications */}
            <div className="results-section" style={{ padding: "50px 80px 40px", background: "#fff" }}>
              <h2 style={{ color: "#1a3a6b", fontSize: "24px", fontWeight: 800, marginBottom: "24px", textAlign: "center" }}>
                Exam Notices / Notifications
              </h2>
              <div className="results-table-wrap" style={{ border: "1px solid rgba(26,58,107,0.12)", borderRadius: "6px", overflow: "hidden", maxWidth: "900px", margin: "0 auto" }}>
                <div
                  className="results-row results-table-header"
                  style={{ display: "flex", padding: "12px 20px", background: "#1a3a6b", fontSize: "13px", fontWeight: 700, color: "#fff" }}
                >
                  <div style={{ width: "70%" }}>Notice Name</div>
                  <div style={{ width: "30%" }}>Notice Link</div>
                </div>

                {(examData.examNoticeDTOS ?? []).length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#777", fontSize: "13px" }}>
                    No notices available right now.
                  </div>
                ) : (
                  (examData.examNoticeDTOS as ExamNoticeDTO[]).map((notice, i) => {
                    const url = notice.noticeData ? base64ToPdfUrl(notice.noticeData) : null;
                    return (
                      <div
                        key={notice.examNoticeId ?? notice.noticeName}
                        className="results-row notice-item-row"
                        style={{ display: "flex", alignItems: "center", padding: "14px 20px", background: i % 2 === 0 ? "#fff" : "#fffbee", fontSize: "13px" }}
                      >
                        <div style={{ width: "70%", color: "#333", fontWeight: 600 }}>{notice.noticeName}</div>
                        <div style={{ width: "30%" }}>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#1569ad", fontWeight: 700, textDecoration: "none", borderBottom: "1px solid #1569ad" }}
                            >
                              View Notice
                            </a>
                          ) : (
                            <span style={{ color: "#aaa", fontWeight: 600, cursor: "not-allowed" }} title="Preview not available">
                              Not Available
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Stats strip */}
            <div
              className="results-stats-strip"
              style={{
                background: "#f5a800",
                padding: "32px 80px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "20px",
                textAlign: "center",
              }}
            >
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div style={{ fontSize: "30px", fontWeight: 800, color: "#1a3a6b" }}>{stat.value}</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a3a6b", letterSpacing: "0.5px", marginTop: "4px" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Exam Results */}
            <div className="results-section" style={{ padding: "60px 80px", background: "#fffbee" }}>
              <h2 style={{ color: "#1a3a6b", fontSize: "26px", fontWeight: 800, marginBottom: "30px", textAlign: "center" }}>
                Exam Results
              </h2>
              <div className="results-table-wrap" style={{ border: "1px solid rgba(26,58,107,0.12)", borderRadius: "6px", overflow: "hidden", maxWidth: "900px", margin: "0 auto" }}>
                <div
                  className="results-row results-table-header"
                  style={{ display: "flex", padding: "12px 20px", background: "#1a3a6b", fontSize: "13px", fontWeight: 700, color: "#fff" }}
                >
                  <div style={{ width: "70%" }}>Exam Name</div>
                  <div style={{ width: "30%" }}>Result Link</div>
                </div>

                {(examData.examResultDTOS ?? []).length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#777", fontSize: "13px" }}>
                    Results not published yet.
                  </div>
                ) : (
                  (examData.examResultDTOS as ExamResultDTO[]).map((row, i) => {
                    const url = row.resultData ? base64ToPdfUrl(row.resultData) : null;
                    return (
                      <div
                        key={row.examResultId ?? row.resultName}
                        className="results-row examresult-item-row"
                        style={{ display: "flex", alignItems: "center", padding: "14px 20px", background: i % 2 === 0 ? "#fff" : "#fffbee", fontSize: "13px" }}
                      >
                        <div style={{ width: "70%", color: "#333", fontWeight: 600 }}>{row.resultName}</div>
                        <div style={{ width: "30%" }}>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#1569ad", fontWeight: 700, textDecoration: "none", borderBottom: "1px solid #1569ad" }}
                            >
                              View Result
                            </a>
                          ) : (
                            <span style={{ color: "#aaa", fontWeight: 600, cursor: "not-allowed" }} title="Preview not available">
                              Not Available
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Toppers - single flat carousel across all toppers, autoplay + responsive page size */}
            <div className="results-section" style={{ padding: "60px 80px", background: "#fffbee" }}>
              <h2 style={{ color: "#1a3a6b", fontSize: "26px", fontWeight: 800, marginBottom: "30px", textAlign: "center" }}>
                This Year's Toppers
              </h2>

              {(examData.toppersDTOS ?? []).length === 0 ? (
                <div style={{ textAlign: "center", color: "#777", fontSize: "13px", padding: "20px" }}>
                  No toppers published yet for this selection.
                </div>
              ) : (
                (() => {
                  const allToppers = examData.toppersDTOS as TopperDTO[];
                  const totalPages = Math.ceil(allToppers.length / cardsPerPage);
                  const start = topperPage * cardsPerPage;
                  const visibleToppers = allToppers.slice(start, start + cardsPerPage);
                  const canGoPrev = topperPage > 0;
                  const canGoNext = topperPage < totalPages - 1;

                  const goPrev = () => {
                    setIsPaused(true);
                    setTopperPage((p) => Math.max(0, p - 1));
                    setTimeout(() => setIsPaused(false), 6000);
                  };
                  const goNext = () => {
                    setIsPaused(true);
                    setTopperPage((p) => Math.min(totalPages - 1, p + 1));
                    setTimeout(() => setIsPaused(false), 6000);
                  };

                  return (
                    <>
                      <div
                        className="toppers-carousel-wrap"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", maxWidth: "1100px", margin: "0 auto" }}
                      >
                        <button
                          onClick={goPrev}
                          disabled={!canGoPrev}
                          aria-label="Previous toppers"
                          style={{
                            flexShrink: 0,
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            border: "none",
                            background: "#fff",
                            color: canGoPrev ? "#1a3a6b" : "#ccc",
                            fontSize: "18px",
                            fontWeight: 800,
                            cursor: canGoPrev ? "pointer" : "not-allowed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                          }}
                        >
                          ‹
                        </button>

                        <div
                          className="toppers-grid"
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "18px",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {visibleToppers.map((t, idx) => {
                            const initials = (t.userName || "?")
                              .split(" ")
                              .map((p) => p[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase();
                            return (
                              <div
                                key={t.topperId ?? `${start + idx}`}
                                className="topper-card"
                                style={{
                                  background: "#fff",
                                  borderRadius: "10px",
                                  padding: "24px",
                                  textAlign: "center",
                                  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                                  borderTop: "4px solid #f5a800",
                                  flex: "1 1 0",
                                  maxWidth: "340px",
                                  minWidth: 0,
                                }}
                              >
                                <div
                                  className="topper-avatar"
                                  style={{
                                    width: "84px",
                                    height: "84px",
                                    borderRadius: "50%",
                                    margin: "0 auto 12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "#1a3a6b",
                                    color: "#fff",
                                    fontSize: "22px",
                                    fontWeight: 800,
                                    overflow: "hidden",
                                  }}
                                >
                                  {t.studentImage ? (
                                    <img
                                      src={`data:image/jpeg;base64,${t.studentImage}`}
                                      alt={t.userName}
                                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                  ) : (
                                    initials
                                  )}
                                </div>
                                <div style={{ color: "#1a3a6b", fontWeight: 700, fontSize: "15px" }}>{t.userName}</div>
                                <div style={{ color: "#777", fontSize: "12px", margin: "4px 0" }}>
                                  {t.std}{t.section ? ` • ${t.section}` : ""}
                                </div>
                                <div style={{ color: "#555", fontSize: "12px" }}>{t.description}</div>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={goNext}
                          disabled={!canGoNext}
                          aria-label="Next toppers"
                          style={{
                            flexShrink: 0,
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            border: "none",
                            background: "#fff",
                            color: canGoNext ? "#1a3a6b" : "#ccc",
                            fontSize: "18px",
                            fontWeight: 800,
                            cursor: canGoNext ? "pointer" : "not-allowed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                          }}
                        >
                          ›
                        </button>
                      </div>

                      {totalPages > 1 && (
                        <div style={{ textAlign: "center", marginTop: "14px", fontSize: "11px", color: "#999" }}>
                          {topperPage + 1} / {totalPages}
                        </div>
                      )}
                    </>
                  );
                })()
              )}
            </div>
          </>
        )
      )}

      {/* Closing banner */}
      <div style={{ position: "relative" }}>
        <img
          className="results-banner-img"
          src={Alumni}
          alt="JNPV alumni"
          style={{ width: "100%", height: "380px", objectFit: "cover", display: "block" }}
        />
        <div
          className="results-banner-overlay"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(26,58,107,0.1) 0%, rgba(26,58,107,0.75) 100%)",
            display: "flex",
            alignItems: "flex-end",
            padding: "40px 80px",
          }}
        >
          <div>
            <h2 style={{ color: "#fff", fontSize: "26px", fontWeight: 800, margin: "0 0 8px" }}>
              Building Futures Beyond the Classroom
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: "14px", maxWidth: "560px", margin: 0, lineHeight: 1.6 }}>
              From board exam excellence to admissions at India's top universities, JNPV students carry
              forward the values and rigor instilled here into the next chapter of their lives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}