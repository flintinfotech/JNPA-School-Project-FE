import Academics1 from "../assets/Academics1.webp";
import Academics2 from "../assets/Academics2.webp";
import SchoolLogo from "../assets/SchoolLogo.avif";
import { useNavigate } from "react-router-dom";

const subjects = [
  { name: "इंग्रजी", desc: "वाचन, लेखन, व्याकरण आणि आकलन यांचा कृती-आधारित शिक्षण पद्धतीद्वारे अभ्यास." },
  { name: "गणित", desc: "संख्या ज्ञान, मूलभूत गणितीय क्रिया, भूमिती आणि प्रत्यक्ष कृतींमधून समस्या सोडविण्याची कौशल्ये." },
  { name: "पर्यावरण अभ्यास", desc: "निसर्ग, कुटुंब, समाज आणि मूलभूत विज्ञानाच्या माध्यमातून आपल्या सभोवतालच्या जगाची ओळख." },
  { name: "हिंदी / मराठी", desc: "कथा, कविता आणि संवादात्मक सरावाद्वारे प्रादेशिक भाषेचे प्रभावी ज्ञान." },
  { name: "संगणक विज्ञान", desc: "डिजिटल साक्षरता, संगणकाची मूलभूत संकल्पना आणि शैक्षणिक साधनांची ओळख." },
  { name: "कला व हस्तकला", desc: "चित्रकला, रंगकाम आणि हस्तकला प्रकल्पांच्या माध्यमातून सर्जनशीलतेचा विकास." },
];

const highlights = [
  "कृती-आधारित व खेळातून शिकण्याची अध्यापन पद्धती",
  "इयत्ता तिसरीपर्यंत वाचन व गणितातील मजबूत पाया",
  "साप्ताहिक ग्रंथालय सत्रे आणि गोष्टी सांगण्याचे उपक्रम",
  "तणावमुक्त नियमित सतत मूल्यमापन",
  "प्रत्येक विषयामध्ये नैतिक मूल्ये व नागरिकत्वाची जाणीव विकसित करणे",
];

const stats = [
  { label: "CBSE Affiliated", value: "100%" },
  { label: "Avg. Pass Percentage", value: "98%" },
  { label: "Subjects Offered", value: "20+" },
  { label: "Student-Teacher Ratio", value: "15:1" },
];

export default function AcademicsPrimaryMarathi() {
  const navigate = useNavigate();

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
           .acad-pr-page .academics-stats-strip { padding: 24px 20px !important; grid-template-columns: repeat(2, 1fr) !important; }
          .acad-pr-page .acad-banner { height: 260px !important; }
          .acad-pr-page .acad-banner-overlay { padding: 24px 20px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1569ad", position: "relative" }}>
        <div className="acad-header-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "18px 40px 0" }}>
          <img src={SchoolLogo} alt="JNPV Logo" style={{ height: "78px", width: "auto", display: "block" }} />
        </div>
        <div className="acad-title-wrap" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 26px" }}>
          <button onClick={() => navigate("/academics")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "13px", cursor: "pointer", padding: 0, marginBottom: "8px" }}>
            ← शैक्षणिक विभागाकडे परत
          </button>
          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 500, margin: 0 }}>प्राथमिक शाळा</h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", marginTop: "6px" }}>
            इयत्ता १ · इयत्ता २ · इयत्ता ३ · इयत्ता ४
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="acad-hero-wrap" style={{ width: "79%", margin: "-25px auto 20px", overflow: "hidden", position: "relative", zIndex: 10 }}>
        <img src={Academics1} alt="JNPV प्राथमिक शाळा" style={{ width: "100%", display: "block", maxHeight: "400px", objectFit: "cover" }} />
      </div>

      {/* Stats strip */}
      <div
        className="academics-stats-strip"
        style={{ background: "#f5a800", padding: "32px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "20px", textAlign: "center" }}
      >
        {stats.map((stat) => (
          <div key={stat.label}>
            <div style={{ fontSize: "30px", fontWeight: 800, color: "#1a3a6b" }}>{stat.value}</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a3a6b", letterSpacing: "0.5px", marginTop: "4px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Subjects */}
      <div className="acad-section" style={{ padding: "50px 80px", background: "#fffbee" }}>
        <h2 style={{ color: "#1a3a6b", fontSize: "24px", fontWeight: 800, marginBottom: "10px", textAlign: "center" }}>अभ्यासक्रमातील विषय</h2>
        <p style={{ color: "#777", fontSize: "14px", textAlign: "center", marginBottom: "36px" }}>
          विद्यार्थ्यांचा भक्कम शैक्षणिक पाया तयार करणारा सर्वांगीण अभ्यासक्रम
        </p>
        <div
          className="acad-subjects-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}
        >
          {subjects.map((s) => (
            <div key={s.name} style={{ background: "#fff", borderTop: "4px solid #1569ad", borderRadius: "6px", padding: "24px", boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
              <h3 style={{ color: "#1a3a6b", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>{s.name}</h3>
              <p style={{ color: "#555", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
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
              आमचा प्राथमिक शाळेचा अभ्यासक्रम विद्यार्थ्यांना सुरक्षित, आनंददायी आणि प्रेरणादायी शिक्षणाचे वातावरण प्रदान करतो. या वातावरणात प्रत्येक विद्यार्थ्याला नवीन गोष्टी जाणून घेण्यासाठी, प्रश्न विचारण्यासाठी आणि सर्वांगीण विकास साधण्यासाठी प्रोत्साहन दिले जाते. लहान वर्गसंख्या आणि समर्पित शिक्षकांच्या मार्गदर्शनामुळे प्रत्येक विद्यार्थ्याकडे वैयक्तिक लक्ष दिले जाते.
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
        <div className="acad-banner-overlay" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(180deg, rgba(21,105,173,0.2) 0%, rgba(21,105,173,0.85) 100%)", display: "flex", alignItems: "flex-end", padding: "40px 80px" }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: "24px", fontWeight: 800, margin: "0 0 8px" }}>उज्ज्वल भविष्याची भक्कम सुरुवात</h2>
            <p style={{ color: "#cbd5e1", fontSize: "14px", maxWidth: "560px", margin: 0, lineHeight: 1.6 }}>
              प्राथमिक शाळा at JNPV lays the intellectual, social, and emotional foundation that every student carries through their academic journey and beyond.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: "50px 80px", background: "#1569ad", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: 800, marginBottom: "10px" }}>अधिक माहिती हवी आहे का?</h2>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", marginBottom: "22px" }}>
          Reach out to our academic team for more details about the प्राथमिक शाळा curriculum.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
          <button style={{ background: "#fff", color: "#1569ad", border: "none", padding: "12px 28px", fontSize: "13px", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", borderRadius: "4px", cursor: "pointer" }}>
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