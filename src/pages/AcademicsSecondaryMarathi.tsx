import Academics1 from "../assets/Academics1.webp";
import Academics2 from "../assets/Academics2.webp";
import SchoolLogo from "../assets/SchoolLogo.avif";
import { useNavigate } from "react-router-dom";

const streams = [
  {
    name: "विज्ञान",
    subjects: ["भौतिकशास्त्र", "रसायनशास्त्र", "Biology / Computer विज्ञान", "गणित", "इंग्रजी"],
    desc: "अभियांत्रिकी, वैद्यकीय आणि संशोधन क्षेत्रासाठी विद्यार्थ्यांची तयारी. सुसज्ज प्रयोगशाळा व JEE आणि NEET परीक्षांसाठी विशेष मार्गदर्शन.",
  },
  {
    name: "वाणिज्य",
    subjects: ["लेखाशास्त्र", "व्यवसाय अध्ययन", "अर्थशास्त्र", "गणित / IP", "इंग्रजी"],
    desc: "CA, MBA किंवा वाणिज्य शाखेतील उच्च शिक्षण घेऊ इच्छिणाऱ्या विद्यार्थ्यांसाठी उपयुक्त. आर्थिक साक्षरता व विश्लेषणात्मक कौशल्यांवर भर.",
  },
  {
    name: "कला",
    subjects: ["इतिहास", "Political विज्ञान", "भूगोल / मानसशास्त्र", "अर्थशास्त्र", "इंग्रजी"],
    desc: "कायदा, पत्रकारिता, डिझाइन व समाजशास्त्रात रस असलेल्या विद्यार्थ्यांसाठी योग्य. चिकित्सक विचारसरणी व संवाद कौशल्यांचा विकास.",
  },
];

const highlights = [
  "बोर्ड परीक्षेसाठी विशेष तयारी, सराव परीक्षा व नियोजित उजळणी",
  "इयत्ता अकरावीपासून करिअर मार्गदर्शन व विद्यापीठ प्रवेश सल्ला",
  "JEE, NEET, CLAT स्पर्धा परीक्षांसाठी वैयक्तिक मार्गदर्शन",
  "विविध क्षेत्रातील तज्ज्ञांचे विशेष व्याख्यान",
  "Lab-based practicals for all विज्ञान stream students",
  "मागील सलग ५ वर्षे १००% बोर्ड निकाल",
];

export default function AcademicsSecondaryMarathi() {
  const navigate = useNavigate();

  return (
    <div className="acad-sec-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @media (max-width: 768px) {
          .acad-sec-page .acad-header-inner { padding: 14px 20px 0 !important; }
          .acad-sec-page .acad-header-inner img { height: 56px !important; }
          .acad-sec-page .acad-title-wrap { padding: 0 20px 18px !important; }
          .acad-sec-page .acad-title-wrap h1 { font-size: 24px !important; }
          .acad-sec-page .acad-hero-wrap { width: 92% !important; margin: -16px auto 14px !important; }
          .acad-sec-page .acad-hero-wrap img { max-height: 200px !important; }
          .acad-sec-page .acad-section { padding: 32px 20px !important; }
          .acad-sec-page .acad-streams-grid { grid-template-columns: 1fr !important; }
          .acad-sec-page .acad-split { grid-template-columns: 1fr !important; gap: 28px !important; }
          .acad-sec-page .acad-banner { height: 260px !important; }
          .acad-sec-page .acad-banner-overlay { padding: 24px 20px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1f4d3d", position: "relative" }}>
        <div className="acad-header-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "18px 40px 0" }}>
          <img src={SchoolLogo} alt="JNPV Logo" style={{ height: "78px", width: "auto", display: "block" }} />
        </div>
        <div className="acad-title-wrap" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 26px" }}>
          <button onClick={() => navigate("/academics")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "13px", cursor: "pointer", padding: 0, marginBottom: "8px" }}>
            ← शैक्षणिक विभागाकडे परत
          </button>
          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 500, margin: 0 }}>माध्यमिक शाळा</h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", marginTop: "6px" }}>
            इयत्ता ५ · इयत्ता ६ · इयत्ता ७ · इयत्ता ८ · इयत्ता ९ · इयत्ता १०
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="acad-hero-wrap" style={{ width: "79%", margin: "-25px auto 20px", overflow: "hidden", position: "relative", zIndex: 10 }}>
        <img src={Academics1} alt="JNPV माध्यमिक शाळा" style={{ width: "100%", display: "block", maxHeight: "400px", objectFit: "cover" }} />
      </div>

      {/* Streams */}
      <div className="acad-section" style={{ padding: "50px 80px", background: "#fffbee" }}>
        <h2 style={{ color: "#1a3a6b", fontSize: "24px", fontWeight: 800, marginBottom: "10px", textAlign: "center" }}>उपलब्ध शाखा</h2>
        <p style={{ color: "#777", fontSize: "14px", textAlign: "center", marginBottom: "36px" }}>
          तुमच्या आवडी व क्षमतेनुसार योग्य शाखा निवडा
        </p>
        <div className="acad-streams-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
          {streams.map((s) => (
            <div key={s.name} style={{ background: "#fff", borderTop: "4px solid #1f4d3d", borderRadius: "6px", padding: "28px", boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
              <h3 style={{ color: "#1f4d3d", fontSize: "18px", fontWeight: 800, marginBottom: "12px" }}>{s.name}</h3>
              <ul style={{ margin: "0 0 14px", padding: "0 0 0 16px", color: "#555", fontSize: "13px", lineHeight: 1.8 }}>
                {s.subjects.map((sub) => <li key={sub}>{sub}</li>)}
              </ul>
              <p style={{ color: "#777", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Highlights + image */}
      <div className="acad-section" style={{ padding: "50px 80px" }}>
        <div className="acad-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
          <div>
            <h2 style={{ color: "#1a3a6b", fontSize: "22px", fontWeight: 800, marginBottom: "18px" }}>आमची वैशिष्ट्ये</h2>
            <p style={{ color: "#555", fontSize: "14px", lineHeight: 1.7, marginBottom: "20px" }}>
              माध्यमिक शाळा at JNPV is where preparation meets ambition. Our dedicated faculty, structured revision programs, and individual mentoring ensure every student is ready — not just for board exams, but for the challenges ahead.
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {highlights.map((h) => (
                <li key={h} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px", fontSize: "14px", color: "#333" }}>
                  <span style={{ color: "#1f4d3d", fontWeight: 800, fontSize: "16px", lineHeight: 1 }}>✓</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
            <img src={Academics2} alt="माध्यमिक शाळा students" style={{ width: "100%", display: "block", objectFit: "cover" }} />
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="acad-banner" style={{ position: "relative", height: "320px", overflow: "hidden" }}>
        <img src={Academics1} alt="JNPV Senior" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div className="acad-banner-overlay" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(180deg, rgba(31,77,61,0.2) 0%, rgba(31,77,61,0.88) 100%)", display: "flex", alignItems: "flex-end", padding: "40px 80px" }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: "24px", fontWeight: 800, margin: "0 0 8px" }}>उद्याच्या यशासाठी सज्ज</h2>
            <p style={{ color: "#d1fae5", fontSize: "14px", maxWidth: "560px", margin: 0, lineHeight: 1.6 }}>
              Our माध्यमिक शाळा students leave JNPV not just with strong results but with the confidence, values, and vision to succeed at university and in life.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: "50px 80px", background: "#1f4d3d", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: 800, marginBottom: "10px" }}>अधिक माहिती हवी आहे का?</h2>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", marginBottom: "22px" }}>
          Reach out to our academic team for more details about माध्यमिक शाळा streams and preparation.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
          <button style={{ background: "#fff", color: "#1f4d3d", border: "none", padding: "12px 28px", fontSize: "13px", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", borderRadius: "4px", cursor: "pointer" }}>
            माहिती पुस्तिका डाउनलोड करा
          </button>
          <button onClick={() => navigate("/academics")} style={{ background: "transparent", color: "#fff", border: "2px solid #fff", padding: "12px 28px", fontSize: "13px", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", borderRadius: "4px", cursor: "pointer" }}>
            ← शैक्षणिक विभागाकडे परत
          </button>
        </div>
      </div>
    </div>
  );
}