import SchoolLogo from "../assets/SchoolLogo.avif";
import CoCurricular1 from "../assets/CoCurricular1.jpg";

export default function EnvironmentalInitiatives() {
  return (
    <div className="env-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#333", background: "#fff", overflowX: "hidden" }}>
      <style>{`
        @media (max-width: 768px) {
          .env-page .env-header-inner { padding: 14px 20px 0 !important; }
          .env-page .env-header-inner img { height: 56px !important; }
          .env-page .env-title-wrap { padding: 0 20px 18px !important; }
          .env-page .env-title-wrap h1 { font-size: 22px !important; }
          .env-page .env-hero-wrap { width: 92% !important; }
          .env-page .env-hero-wrap img { max-height: 220px !important; }
          .env-page .env-body { width: 92% !important; padding: 30px 0 !important; }
          .env-page .env-two-col { grid-template-columns: 1fr !important; gap: 0 !important; }
        }
        @media (max-width: 460px) {
          .env-page .env-title-wrap h1 { font-size: 18px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1569ad", position: "relative" }}>
        <div className="env-header-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "18px 40px 0" }}>
          <img src={SchoolLogo} alt="JNPV Logo" style={{ height: "78px", width: "auto", display: "block" }} />
        </div>
        <div className="env-title-wrap" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 26px" }}>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: "0 0 6px" }}>
            Home / Student Life
          </p>
          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 500, margin: 0 }}>
            Environmental Initiatives
          </h1>
        </div>
      </div>

      {/* Hero image */}
      <div className="env-hero-wrap" style={{ width: "79%", margin: "0 auto", overflow: "hidden" }}>
        <img
          src={CoCurricular1}
          alt="Students at environmental initiative"
          style={{ width: "100%", display: "block", maxHeight: "460px", objectFit: "cover" }}
        />
      </div>

      {/* Main body */}
      <div className="env-body" style={{ width: "79%", margin: "0 auto", padding: "50px 0 60px" }}>
        <h2 style={{ color: "#2a78b5", fontSize: "24px", fontWeight: 800, marginBottom: "32px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Environmental Initiatives
        </h2>

        <div className="env-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }}>

          {/* Left column */}
          <div>
            <h3 style={{ color: "#333", fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>
              Sustainability &amp; Community Engagement at JNPV
            </h3>
            <p style={{ color: "#444", fontSize: "14px", lineHeight: 1.9, marginBottom: "16px", textAlign: "justify" }}>
              At JNPV, sustainability is embedded in culture, curriculum, and community action. Guided by the belief that "every day is Earth Day," the school actively models environmental responsibility through measurable initiatives and student-led innovation.
            </p>
            <p style={{ color: "#444", fontSize: "14px", lineHeight: 1.9, marginBottom: "16px", textAlign: "justify" }}>
              Our waste segregation programme has increased recycling participation from <strong>30% to 79%</strong>, supported by clearly labelled biodegradable and non-biodegradable bins across campus. The student-led <strong>3R Paper Project</strong>, driven by our "paper santas," collects <strong>80-165 kg of paper monthly</strong> for recycling, with funds supporting underprivileged children through NGO partnerships.
            </p>
            <p style={{ color: "#444", fontSize: "14px", lineHeight: 1.9, marginBottom: "16px", textAlign: "justify" }}>
              Kitchen waste is composted through dedicated composting units, generating approximately <strong>225 kg of organic manure every 45 days</strong>. Energy conservation is promoted through phased LED installations, while campaigns such as <strong>Save Water</strong> and <strong>No Pollution Diwali</strong> extend environmental awareness beyond the campus.
            </p>
          </div>

          {/* Right column */}
          <div>
            <p style={{ color: "#444", fontSize: "14px", lineHeight: 1.9, marginBottom: "20px", textAlign: "justify" }}>
              JNPV's leadership in sustainability has earned formal recognition, including the <strong>Indian Green Building Certification</strong> and ongoing efforts toward <strong>Platinum Level Certification</strong> for its new facility. Students have received prestigious accolades such as the <strong>Diana Award</strong> for e-waste recycling and international STEM honours for renewable energy and IoT-based environmental innovations.
            </p>
            <p style={{ color: "#444", fontSize: "14px", lineHeight: 1.9, marginBottom: "20px", textAlign: "justify" }}>
              Strong partnerships with organisations such as ReCharkha, ACORN Foundation, Afroz Shah (UN Environment Programme - Champions of the Earth), and the IB Organisation amplify this impact. Our annual CAS Fete supports multiple NGOs, with recycled infrastructure reinforcing our sustainability ethos.
            </p>
            <p style={{ color: "#444", fontSize: "14px", lineHeight: 1.9, marginBottom: "20px", textAlign: "justify" }}>
              Together, these initiatives reflect JNPV's commitment to measurable environmental impact, community collaboration, and a culture of responsible global citizenship.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}   