import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Academics1 from "../assets/Academics1.webp";
import Academics2 from "../assets/Academics2.webp";
import SchoolLogo from "../assets/SchoolLogo.avif";
import {
  getAllClassRooms,
  type ClassRoomDTO,
  type AcademicYearDTO,
} from "../services/ClassroomService"; // adjust path to match your project

const highlights = [
  "Activity-based and play-integrated learning approach",
  "Strong focus on reading fluency and numeracy by Grade III",
  "Weekly library sessions and storytelling programs",
  "Regular formative assessments with no high-pressure exams",
  "Integration of moral values and civic sense across subjects",
];

function base64ToBlobUrl(base64: string | null | undefined, mimeHint?: string): string | null {
  if (!base64) return null;
  try {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    let mime = mimeHint;
    if (!mime) {
      if (base64.startsWith("JVBERi0")) mime = "application/pdf";
      else if (base64.startsWith("/9j/")) mime = "image/jpeg";
      else if (base64.startsWith("iVBOR")) mime = "image/png";
      else mime = "application/octet-stream";
    }
    return URL.createObjectURL(new Blob([byteArray], { type: mime }));
  } catch (err) {
    console.error("Failed to decode base64 file:", err);
    return null;
  }
}

export default function AcademicsPrimaryEnglish() {
  const navigate = useNavigate();

  const [classRoom, setClassRoom] = useState<ClassRoomDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedYearId, setExpandedYearId] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<{
    yearId: number;
    subScreenId: number;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchClassRoom() {
      try {
        setLoading(true);
        const res = await getAllClassRooms(0, 10, {
          classRoomName: "Primary",
          medium: "English", // adjust key name if your DTO uses mediumType / mediumName etc.
        }, controller.signal);
        const payload = res?.data?.data;
        const rooms: ClassRoomDTO[] = payload?.Data || payload?.content || [];
        const room = rooms[0] || null;
        setClassRoom(room);
      } catch (err: any) {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          console.error("Failed to fetch Secondary (English) classroom data:", err);
          setError("Failed to load academic data.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchClassRoom();
    return () => controller.abort();
  }, []);

  const currentYear: AcademicYearDTO | undefined =
    classRoom?.academicYearDTOS?.find((y) => y.isCurrent) || classRoom?.academicYearDTOS?.[0];

  const stats = [
    { label: "CBSE Affiliated", value: currentYear?.cbseAffiliated ?? "-" },
    {
      label: "Avg. Pass Percentage",
      value: currentYear?.avgPassingPercentage ? `${currentYear.avgPassingPercentage}%` : "-",
    },
    { label: "Subjects Offered", value: currentYear?.subjectOffered ?? "-" },
    { label: "Student-Teacher Ratio", value: currentYear?.studentTeacherRatio ?? "-" },
  ];

  const handleOpenFile = (base64Data: string) => {
    const url = base64ToBlobUrl(base64Data);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      alert("Unable to open this file.");
    }
  };

  const handleOpenBrochure = () => {
    if (!classRoom?.brochure) {
      alert("Brochure not available.");
      return;
    }
    handleOpenFile(classRoom.brochure);
  };

  return (
    <div className="acad-pr-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .acad-pr-page .acad-header-inner { padding: 14px 20px 0 !important; }
          .acad-pr-page .acad-header-inner img { height: 56px !important; }
          .acad-pr-page .acad-title-wrap { padding: 0 20px 18px !important; }
          .acad-pr-page .acad-title-wrap h1 { font-size: 24px !important; }
          .acad-pr-page .acad-hero-wrap { width: 92% !important; margin: -16px auto 14px !important; }
          .acad-pr-page .acad-hero-wrap img { max-height: 200px !important; }
          .acad-pr-page .acad-section { padding: 32px 20px !important; }
          .acad-pr-page .acad-subjects-grid { grid-template-columns: 1fr !important; }
          .acad-pr-page .acad-split { grid-template-columns: 1fr !important; gap: 28px !important; }
          .acad-pr-page .acad-banner { height: 260px !important; }
          .acad-pr-page .acad-banner-overlay { padding: 24px 20px !important; }
          .acad-pr-page .academics-stats-strip { padding: 24px 20px !important; grid-template-columns: repeat(2, 1fr) !important; }
          .acad-pr-page .acad-year-block { grid-template-columns: 1fr !important; gap: 20px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1569ad", position: "relative" }}>
        <div className="acad-header-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "18px 40px 0" }}>
          <img src={SchoolLogo} alt="JNPV Logo" style={{ height: "78px", width: "auto", display: "block" }} />
        </div>
        <div className="acad-title-wrap" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 26px" }}>
          <button
            onClick={() => navigate("/academics")}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "13px", cursor: "pointer", padding: 0, marginBottom: "8px" }}
          >
            ← Back to Academics
          </button>
          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 500, margin: 0 }}>
            {`${classRoom?.classRoomName || "Primary"} - English`}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", marginTop: "6px" }}>
            {classRoom?.description || "Grade I · Grade II · Grade III · Grade IV"}
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="acad-hero-wrap" style={{ width: "79%", margin: "-25px auto 20px", overflow: "hidden", position: "relative", zIndex: 10 }}>
        <img src={Academics1} alt="JNPV Primary School" style={{ width: "100%", display: "block", maxHeight: "400px", objectFit: "cover" }} />
      </div>

      {error && (
        <p style={{ textAlign: "center", color: "#b91c1c", fontSize: "13px", margin: "0 0 10px" }}>{error}</p>
      )}

      {/* Stats strip */}
      <div
        className="academics-stats-strip"
        style={{ background: "#f5a800", padding: "32px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "20px", textAlign: "center" }}
      >
        {stats.map((stat) => (
          <div key={stat.label}>
            <div style={{ fontSize: "30px", fontWeight: 800, color: "#1a3a6b" }}>
              {loading ? "…" : stat.value}
            </div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a3a6b", letterSpacing: "0.5px", marginTop: "4px" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Academic Year Records */}
      {classRoom?.academicYearDTOS && classRoom.academicYearDTOS.length > 0 && (
        <div className="acad-section" style={{ padding: "50px 80px" }}>
          <h2 style={{ color: "#1a3a6b", fontSize: "24px", fontWeight: 800, marginBottom: "24px", textAlign: "center" }}>
            Academic Year Records
          </h2>

          <div
            className="acad-year-block"
            style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "32px", alignItems: "start" }}
          >
            {/* LEFT: year accordion */}
            <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
              {classRoom.academicYearDTOS.map((year) => {
                const isExpanded = expandedYearId === year.academicYearId;

                return (
                  <div key={year.academicYearId} style={{ borderTop: "1px solid #e2e8f0" }}>
                    <button
                      onClick={() => setExpandedYearId(isExpanded ? null : year.academicYearId)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 20px",
                        background: "#9C4131",
                        color: "#ffff",
                        border: "none",
                        fontSize: "16px",
                        fontWeight: 700,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span>FY-{year.academicYearName}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          transform: isExpanded ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s",
                        }}
                      >
                        ▼
                      </span>
                    </button>

                    {isExpanded && (
                      <div style={{ background: "#fafbfc" }}>
                        {year.subScreenDTOS && year.subScreenDTOS.length > 0 ? (
                          year.subScreenDTOS.map((s) => {
                            const isActive =
                              selectedTable?.yearId === year.academicYearId &&
                              selectedTable?.subScreenId === s.subScreenId;
                            return (
                              <button
                                key={s.subScreenId}
                                onClick={() =>
                                  setSelectedTable({ yearId: year.academicYearId, subScreenId: s.subScreenId })
                                }
                                style={{
                                  width: "100%",
                                  display: "block",
                                  textAlign: "left",
                                  padding: "10px 16px 10px 30px",
                                  background: isActive ? "#E0E0E0" : "transparent",
                                  color: isActive ? "black" : "#333",
                                  border: "none",
                                  borderTop: "1px solid #eef1f4",
                                  fontSize: "12.5px",
                                  fontWeight: isActive ? 700 : 500,
                                  cursor: "pointer",
                                }}
                              >
                                {s.subScreenName}
                              </button>
                            );
                          })
                        ) : (
                          <p style={{ padding: "10px 16px 10px 30px", fontSize: "12px", color: "#888", margin: 0 }}>
                            No records available.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* RIGHT: table */}
            <div style={{ overflowX: "auto" }}>
              {(() => {
                const activeYear = classRoom.academicYearDTOS?.find((y) => y.academicYearId === selectedTable?.yearId);
                const activeSubScreen = activeYear?.subScreenDTOS?.find(
                  (s) => s.subScreenId === selectedTable?.subScreenId
                );

                if (!activeSubScreen) {
                  return <p style={{ fontSize: "13px", color: "#777" }} />;
                }

                if (!activeSubScreen.subScreenDataEntities || activeSubScreen.subScreenDataEntities.length === 0) {
                  return <p style={{ fontSize: "13px", color: "#777" }}>No records available for this selection.</p>;
                }

                return (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#1569ad" }}>
                        <th style={{ color: "#fff", padding: "10px 12px", textAlign: "left", fontWeight: 700 }}>Sr. No.</th>
                        <th style={{ color: "#fff", padding: "10px 12px", textAlign: "left", fontWeight: 700 }}>Subject Name</th>
                        <th style={{ color: "#fff", padding: "10px 12px", textAlign: "left", fontWeight: 700 }}>View File</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSubScreen.subScreenDataEntities.map((row, idx) => (
                        <tr
                          key={row.subScreenDataId}
                          style={{ borderBottom: "1px solid #e5e7eb", background: idx % 2 === 0 ? "#fff" : "#fffbee" }}
                        >
                          <td style={{ padding: "10px 12px" }}>{idx + 1}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <button
                              style={{ background: "none", border: "none", color: "#1569ad", fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "none" }}
                            >
                              {row.subjectName}
                            </button>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <button
                              onClick={() => handleOpenFile(row.subjectData)}
                              style={{ background: "#1569ad", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "4px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            >
                              view
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Subjects Offered — dynamic from subjectDTOList */}
      <div className="acad-section" style={{ padding: "50px 80px", background: "#fffbee" }}>
        <h2 style={{ color: "#1a3a6b", fontSize: "24px", fontWeight: 800, marginBottom: "10px", textAlign: "center" }}>
          Subjects Offered
        </h2>
        <p style={{ color: "#777", fontSize: "14px", textAlign: "center", marginBottom: "36px" }}>
          A well-rounded curriculum designed to build strong foundations
        </p>
        <div className="acad-subjects-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          {classRoom?.subjectDTOList?.map((subj, i) => (
            <div
              key={subj.subjectId ?? i}
              style={{ background: "#fff", borderTop: "4px solid #1569ad", borderRadius: "6px", padding: "24px", boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}
            >
              <h3 style={{ color: "#1a3a6b", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>{subj.subjectName}</h3>
              <p style={{ color: "#555", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>{subj.subjectDescription}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Highlights + image */}
      <div className="acad-section" style={{ padding: "50px 80px" }}>
        <div className="acad-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
          <div>
            <h2 style={{ color: "#1a3a6b", fontSize: "22px", fontWeight: 800, marginBottom: "18px" }}>What Makes It Special</h2>
            <p style={{ color: "#555", fontSize: "14px", lineHeight: 1.7, marginBottom: "20px" }}>
              Our Primary School program creates a safe and joyful environment where children are encouraged to explore, question, and grow. Every child receives individual attention through small class sizes and a dedicated teaching team.
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {highlights.map((h) => (
                <li key={h} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px", fontSize: "14px", color: "#333" }}>
                  <span style={{ color: "#1569ad", fontWeight: 800, fontSize: "16px", lineHeight: 1 }}>✓</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
            <img src={Academics2} alt="Primary school students" style={{ width: "100%", display: "block", objectFit: "cover" }} />
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="acad-banner" style={{ position: "relative", height: "320px", overflow: "hidden" }}>
        <img src={Academics1} alt="JNPV Primary" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div
          className="acad-banner-overlay"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(180deg, rgba(21,105,173,0.2) 0%, rgba(21,105,173,0.85) 100%)", display: "flex", alignItems: "flex-end", padding: "40px 80px" }}
        >
          <div>
            <h2 style={{ color: "#fff", fontSize: "24px", fontWeight: 800, margin: "0 0 8px" }}>A Strong Start for Life</h2>
            <p style={{ color: "#cbd5e1", fontSize: "14px", maxWidth: "560px", margin: 0, lineHeight: 1.6 }}>
              Primary School at JNPV lays the intellectual, social, and emotional foundation that every student carries through their academic journey and beyond.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: "50px 80px", background: "#1569ad", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: 800, marginBottom: "10px" }}>Want to Know More?</h2>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", marginBottom: "22px" }}>
          Reach out to our academic team for more details about the Primary School curriculum.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
          <button
            onClick={handleOpenBrochure}
            disabled={!classRoom?.brochure}
            style={{
              background: "#fff",
              color: "#1569ad",
              border: "none",
              padding: "12px 28px",
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              borderRadius: "4px",
              cursor: classRoom?.brochure ? "pointer" : "not-allowed",
              opacity: classRoom?.brochure ? 1 : 0.6,
            }}
          >
            Download Brochure
          </button>
          <button
            onClick={() => navigate("/academics")}
            style={{ background: "transparent", color: "#fff", border: "2px solid #fff", padding: "12px 28px", fontSize: "13px", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", borderRadius: "4px", cursor: "pointer" }}
          >
            ← Back to Academics
          </button>
        </div>
      </div>
    </div>
  );
}