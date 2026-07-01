import SchoolLogo from "../assets/SchoolLogo.avif";
import CoCurricular1 from "../assets/CoCurricular1.jpg";
import CoCurricular2 from "../assets/CoCurricular2.jpg";
import CoCurricular3 from "../assets/CoCurricular3.jpg";

const activities = [
  {
    title: "Activities",
    isHeading: true,
    body: "Students are selected to participate in the core activity groups based on aptitude, effort and commitment. Participation in core activity groups is voluntary but students are expected to commit to regular attendance. The 'core' activity groups for non-sporting activities are Robotics, Indian and Western music (both vocal and instrumental), Dance, Drama and Model United Nations.",
  },
  {
    title: "Art Animation",
    body: "Art Animation is a thoroughly enjoyable co-curricular activity where children are taught how to create short films. It is very interesting and brings out the creative side in people. Students opting for this activity learn a wide range of creative arts such as collage, drawing, painting and comic storyboards.",
  },
  {
    title: "Needle Work",
    body: "Good basic needlework is not just an activity but a life skill. In the context of an age ruled by technology, teaching handwork ensures that the country's rich tradition of culture is passed down from one generation to the next. The skills developed also enhance critical thinking and math skills.",
  },
  {
    title: "Pottery",
    body: "Students who take part in pottery learn how to use different clay building and making techniques. They are encouraged to think creatively and independently and produce original and exciting works made from clay. They learn how to add different decorations and how to carve patterns successfully.",
  },
  {
    title: "Scrabble",
    body: "Scrabble is not only about building a community of wordsmiths but also about stimulating the memory and the art of strategy building. Students learn to expand their vocabulary while developing sharp analytical thinking in a fun and collaborative environment.",
  },
  {
    title: "Theatre",
    body: "Basic techniques of dramatization and script writing, improvisation. Starting with general introductory games, the students are exposed to a whole gamut of activities which vary from session to session, ensuring that each child's individual creative expression is nurtured and brought out.",
  },
];

export default function CoCurricularActivities() {
  return (
    <div className="cocurr-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#333", background: "#fff", overflowX: "hidden" }}>
      <style>{`
        @media (max-width: 768px) {
          .cocurr-page .cc-header-inner { padding: 14px 20px 0 !important; }
          .cocurr-page .cc-header-inner img { height: 56px !important; }
          .cocurr-page .cc-title-wrap { padding: 0 20px 18px !important; }
          .cocurr-page .cc-title-wrap h1 { font-size: 20px !important; }
          .cocurr-page .cc-hero-wrap { width: 92% !important; }
          .cocurr-page .cc-hero-wrap img { max-height: 220px !important; }
          .cocurr-page .cc-body { width: 92% !important; padding: 30px 0 !important; }
          .cocurr-page .cc-intro-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .cocurr-page .cc-activities-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
          .cocurr-page .cc-gallery { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
        }
        @media (max-width: 460px) {
          .cocurr-page .cc-title-wrap h1 { font-size: 18px !important; }
          .cocurr-page .cc-gallery { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1569ad", position: "relative" }}>
        <div className="cc-header-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "18px 40px 0" }}>
          <img src={SchoolLogo} alt="JNPV Logo" style={{ height: "78px", width: "auto", display: "block" }} />
        </div>
        <div className="cc-title-wrap" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 26px" }}>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: "0 0 6px" }}>
            Home / Student Life / Activities
          </p>
          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 500, margin: 0 }}>
            Co-curricular 
          </h1>
        </div>
      </div>

      {/* Hero image */}
      <div className="cc-hero-wrap" style={{ width: "79%", margin: "0 auto", overflow: "hidden" }}>
        <img
          src={CoCurricular1}
          alt="Students doing co-curricular activities"
          style={{ width: "100%", display: "block", maxHeight: "460px", objectFit: "cover" }}
        />
      </div>

      {/* Main body */}
      <div className="cc-body" style={{ width: "79%", margin: "0 auto", padding: "50px 0 60px" }}>

        {/* Intro — two column */}
        <div className="cc-intro-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", marginBottom: "48px" }}>
          <div>
            <h2 style={{ color: "#2a78b5", fontSize: "22px", fontWeight: 800, marginBottom: "18px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Co-Curricular Activities
            </h2>
            <p style={{ color: "#444", fontSize: "15px", lineHeight: 1.8, marginBottom: "16px", textAlign: "justify" }}>
              It is mandatory for all students to participate in one sport and one non-sporting activity as part of the regular Time Table from Classes I to XII.
            </p>
            <p style={{ color: "#444", fontSize: "15px", lineHeight: 1.8, textAlign: "justify" }}>
              The School offers a wide variety of non-sporting activities to students from Class I onwards. Classes I to IV are engaged in co-curricular activities once a week, while for classes V to X it is offered twice a week.
            </p>
          </div>
          <div>
            <img src={CoCurricular2} alt="Pottery activity" style={{ width: "100%", display: "block", borderRadius: "4px", objectFit: "cover" }} />
          </div>
        </div>

        {/* Activities grid */}
        <div className="cc-activities-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px" }}>
          {activities.map((act) => (
            <div key={act.title} style={{ marginBottom: "28px" }}>
              <h3 style={{
                color: act.isHeading ? "#2a78b5" : "#e89500",
                fontSize: act.isHeading ? "17px" : "18px",
                fontWeight: act.isHeading ? 800 : 700,
                marginBottom: "10px",
                textDecoration: act.isHeading ? "underline" : "none",
              }}>
                {act.title}
              </h3>
              <p style={{ color: "#444", fontSize: "14px", lineHeight: 1.8, textAlign: "justify", margin: 0 }}>
                {act.body}
              </p>
            </div>
          ))}
        </div>

        {/* Gallery */}
        <div className="cc-gallery" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginTop: "40px" }}>
          {[CoCurricular1, CoCurricular2, CoCurricular3].map((img, i) => (
            <div key={i} style={{ overflow: "hidden", borderRadius: "4px", aspectRatio: "4/3" }}>
              <img
                src={img}
                alt={`Co-curricular activity ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.25s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}