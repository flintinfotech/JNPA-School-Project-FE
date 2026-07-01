import SchoolLogo from "../assets/SchoolLogo.avif";
import Admission1 from "../assets/Admission1.jpg";

export default function StudentCouncil() {
  return (
    <div className="sc-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#333", background: "#fff", overflowX: "hidden" }}>
      <style>{`
        @media (max-width: 768px) {
          .sc-page .sc-header-inner { padding: 14px 20px 0 !important; }
          .sc-page .sc-header-inner img { height: 56px !important; }
          .sc-page .sc-title-wrap { padding: 0 20px 18px !important; }
          .sc-page .sc-title-wrap h1 { font-size: 22px !important; }
          .sc-page .sc-hero-wrap { width: 92% !important; }
          .sc-page .sc-hero-wrap img { max-height: 220px !important; }
          .sc-page .sc-body { width: 92% !important; padding: 30px 0 !important; }
          .sc-page .sc-two-col { grid-template-columns: 1fr !important; gap: 0 !important; }
          .sc-page .sc-roles-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
        }
        @media (max-width: 460px) {
          .sc-page .sc-title-wrap h1 { font-size: 18px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1569ad", position: "relative" }}>
        <div className="sc-header-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "18px 40px 0" }}>
          <img src={SchoolLogo} alt="JNPV Logo" style={{ height: "78px", width: "auto", display: "block" }} />
        </div>
        <div className="sc-title-wrap" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 26px" }}>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: "0 0 6px" }}>
            Home / Student Life / Student Council
          </p>
          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 500, margin: 0 }}>Student Council</h1>
        </div>
      </div>

      {/* Hero image */}
      <div className="sc-hero-wrap" style={{ width: "79%", margin: "0 auto", overflow: "hidden" }}>
        <img
          src={Admission1}
          alt="Student Council Investiture Ceremony"
          style={{ width: "100%", display: "block", maxHeight: "460px", objectFit: "cover" }}
        />
      </div>

      {/* Main body */}
      <div className="sc-body" style={{ width: "79%", margin: "0 auto", padding: "50px 0 60px" }}>

        <h2 style={{ color: "#2a78b5", fontSize: "24px", fontWeight: 800, marginBottom: "32px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Student Council
        </h2>

        {/* Two col intro */}
        <div className="sc-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", marginBottom: "48px" }}>
          <div>
            <h3 style={{ color: "#333", fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>Leadership from Within</h3>
            <p style={{ color: "#444", fontSize: "14px", lineHeight: 1.9, marginBottom: "16px", textAlign: "justify" }}>
              The JNPV Student Council is the elected representative body of the student community. It serves as a bridge between students and school administration, ensuring that student voices are heard, respected, and acted upon in matters that shape school life.
            </p>
            <p style={{ color: "#444", fontSize: "14px", lineHeight: 1.9, marginBottom: "16px", textAlign: "justify" }}>
              Every year, students from Grades VI to XII participate in a democratic election process to choose their representatives. The elected council is formally inducted through the Investiture Ceremony, a proud tradition that marks the beginning of a year of service, leadership, and responsibility.
            </p>
            <p style={{ color: "#444", fontSize: "14px", lineHeight: 1.9, textAlign: "justify" }}>
              Council members are expected to lead by example, uphold the values of the school, and actively contribute to building a positive and inclusive campus culture for all students.
            </p>
          </div>
          <div>
            <h3 style={{ color: "#333", fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>Purpose and Vision</h3>
            <p style={{ color: "#444", fontSize: "14px", lineHeight: 1.9, marginBottom: "16px", textAlign: "justify" }}>
              The Student Council at JNPV is guided by the core belief that leadership is a service, not a privilege. Council members are selected not only for their academic standing but also for their integrity, empathy, and commitment to the school community.
            </p>
            <p style={{ color: "#444", fontSize: "14px", lineHeight: 1.9, marginBottom: "16px", textAlign: "justify" }}>
              Throughout the academic year, the council organizes events, drives awareness campaigns, and collaborates with faculty to improve student experience. From managing school assemblies to spearheading community outreach drives, the council plays an active and visible role in shaping school culture.
            </p>
            <p style={{ color: "#444", fontSize: "14px", lineHeight: 1.9, textAlign: "justify" }}>
              The experiences gained through council membership prepare students for real-world leadership, teaching them collaboration, decision-making, communication, and accountability.
            </p>
          </div>
        </div>

        {/* Roles */}
        <h3 style={{ color: "#2a78b5", fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>Council Roles</h3>
        <div className="sc-roles-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "48px" }}>
          {[
            { role: "Head Boy & Head Girl", desc: "The most senior student leaders, responsible for representing the entire student body and setting the tone for school culture." },
            { role: "Deputy Head Boy & Girl", desc: "Support the Head Boy and Head Girl in all responsibilities and step in during their absence." },
            { role: "House Captains", desc: "Lead their respective houses in academic, sporting, and cultural competitions throughout the year." },
            { role: "Cultural Secretary", desc: "Oversee the planning and execution of cultural events, festivals, and inter-school competitions." },
            { role: "Sports Secretary", desc: "Coordinate sporting events, manage house teams, and promote participation in athletics across all grades." },
            { role: "Class Representatives", desc: "Act as the voice of their class, communicating student feedback and concerns to the council and faculty." },
          ].map((item) => (
            <div key={item.role} style={{ background: "#fffbee", borderLeft: "4px solid #f5a800", borderRadius: "6px", padding: "20px", boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
              <h4 style={{ color: "#1a3a6b", fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>{item.role}</h4>
              <p style={{ color: "#555", fontSize: "13px", lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div style={{ background: "#1a3a6b", borderRadius: "6px", padding: "28px 32px" }}>
          <h3 style={{ color: "#f5a800", fontSize: "16px", fontWeight: 700, marginBottom: "10px" }}>Investiture Ceremony</h3>
          <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: 1.8, margin: 0 }}>
            Each academic year begins with the Investiture Ceremony, where newly elected council members are formally presented with their badges and sashes in front of the entire school. The ceremony is a celebration of student leadership and a reaffirmation of the council's commitment to serve the school community with dedication, honesty, and pride.
          </p>
        </div>

      </div>
    </div>
  );
}