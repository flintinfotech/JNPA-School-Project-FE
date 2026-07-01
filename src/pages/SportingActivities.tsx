import SchoolLogo from "../assets/SchoolLogo.avif";
import Sport1 from "../assets/Sport1.jpg";
import Sport2 from "../assets/Sport2.jpg";
import Sport3 from "../assets/Sport3.jpg";
import Sport4 from "../assets/Sport4.jpg";
import Sport5 from "../assets/Sport5.jpg";

const sections = [
  {
    image: Sport5,
    alt: "Students running at sports day",
    title: "SPORTING ACTIVITIES",
    body: [
      "The Core Sporting activity sessions are planned for students with advanced skills and are conducted 2–3 times a week for 1 to 2 hours depending on the sport. These rigorous training sessions focus on tactics and on enhancing performance through advanced skills.",
      "The Heads along with the Physical Education Department, the parent and the student chalk out the goal towards excellence. The class teachers constantly monitor the child's academic progress during the time when she / he is absent from class for a long period whilst preparing and participating in competitions.",
    ],
    imageLeft: true,
  },
  {
    image: Sport2,
    alt: "Judo students at ISSO National Games",
    title: "SPORTS WE OFFER",
    body: [
      "The Core Sporting activities include Basketball, Football, Cricket, Judo and Taekwondo. Apart from Cricket, which is available only to boys in the school, all the other Core Sporting activities are offered to both girls and boys from age Under-6 to Under-19.",
      "Each sport is coached by trained and experienced physical education staff. Students are encouraged to participate in inter-school, district, state, and national-level competitions.",
    ],
    imageLeft: false,
  },
];

const gallery = [Sport3, Sport4, Sport1, Sport2];

export default function SportingActivities() {
  return (
    <div className="sporting-page" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#333", background: "#fff", overflowX: "hidden" }}>
      <style>{`
        @media (max-width: 768px) {
          .sporting-page .sp-header-inner {
            padding: 14px 20px 0 !important;
          }
          .sporting-page .sp-header-inner img {
            height: 56px !important;
          }
          .sporting-page .sp-title-wrap {
            padding: 0 20px 18px !important;
          }
          .sporting-page .sp-title-wrap h1 {
            font-size: 24px !important;
          }
          .sporting-page .sp-hero-wrap {
            width: 92% !important;
            margin: -16px auto 14px !important;
          }
          .sporting-page .sp-hero-wrap img {
            max-height: 220px !important;
          }
          .sporting-page .sp-body {
            width: 92% !important;
            padding: 30px 0 !important;
          }
          .sporting-page .sp-section {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
            margin-bottom: 40px !important;
          }
          .sporting-page .sp-section-img {
            order: 1 !important;
          }
          .sporting-page .sp-section-text {
            order: 2 !important;
          }
          .sporting-page .sp-section-text h2 {
            font-size: 20px !important;
          }
          .sporting-page .sp-gallery {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
        }

        @media (max-width: 460px) {
          .sporting-page .sp-gallery {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1569ad", position: "relative" }}>
        <div className="sp-header-inner" style={{ maxWidth: "1200px", margin: "0 auto", padding: "18px 40px 0" }}>
          <img src={SchoolLogo} alt="JNPV Logo" style={{ height: "78px", width: "auto", display: "block" }} />
        </div>
        <div className="sp-title-wrap" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 26px" }}>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: "0 0 6px" }}>
            Home / Student Life / Activities
          </p>
          <h1 style={{ color: "#fff", fontSize: "34px", fontWeight: 500, margin: 0 }}>Sporting</h1>
        </div>
      </div>

      {/* Hero image */}
      <div
        className="sp-hero-wrap"
        style={{ width: "79%", margin: "-25px auto 0", overflow: "hidden", position: "relative", zIndex: 10 }}
      >
        <img
          src={Sport1}
          alt="Students at sports day"
          style={{ width: "100%", display: "block", maxHeight: "460px", objectFit: "cover" }}
        />
      </div>

      {/* Main body */}
      <div className="sp-body" style={{ width: "79%", margin: "0 auto", padding: "50px 0 60px" }}>

        {/* Alternating sections */}
        {sections.map((sec) => (
          <div
            key={sec.title}
            className="sp-section"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "40px",
              alignItems: "start",
              marginBottom: "60px",
            }}
          >
            <div className="sp-section-img" style={{ order: sec.imageLeft ? 1 : 2 }}>
              <img
                src={sec.image}
                alt={sec.alt}
                style={{ width: "100%", display: "block", objectFit: "cover", borderRadius: "4px" }}
              />
            </div>

            <div className="sp-section-text" style={{ order: sec.imageLeft ? 2 : 1 }}>
              <h2 style={{ color: "#2a78b5", fontSize: "24px", fontWeight: 700, marginBottom: "18px", letterSpacing: "0.5px" }}>
                {sec.title}
              </h2>
              {sec.body.map((para, i) => (
                <p key={i} style={{ color: "#444", fontSize: "15px", lineHeight: 1.8, marginBottom: "16px", textAlign: "justify" }}>
                  {para}
                </p>
              ))}
            </div>
          </div>
        ))}

        {/* Photo gallery row */}
        <div
          className="sp-gallery"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginTop: "10px" }}
        >
          {gallery.map((img, i) => (
            <div key={i} style={{ overflow: "hidden", borderRadius: "4px", aspectRatio: "4/3" }}>
              <img
                src={img}
                alt={`Sport activity ${i + 1}`}
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