import { useState } from "react";
import schoolLogo from "../assets/SchoolLogo.avif";
import schoolBuilding from "../assets/Img1.webp";
import inspirationImage from "../assets/Img2.webp"; // TODO: replace with the real "Our Inspiration" image

const sidebarItems = [
  "About Us",
  "Our Inspiration",
  "Message from Founder & Chairperson and Vice-Chairperson",
  "Vision, Mission, Motto, Values & Objectives",
  "JNPV Philosophy",
  "JNPV Strategic Plan",
  "Unique Features",
];

// Dummy content per sidebar item — replace each "title" and "columns" text
// with the real content later. Each entry maps 1:1 with an item in sidebarItems.
const sectionContent: Record<
  string,
  { title: string; image?: string; columns: string[][] }
> = {
  "About Us": {
    title: "THE SCHOOL",
    columns: [
      [
        `Jawaharlal Nehru Port Vidyalaya is co-educational International Day School established in 2003, with a view to offering world-class educational opportunities in the city of Mumbai.`,
        `The School is affiliated to the CISCE (Council for the Indian School Certificate Examinations) and CAIE (Cambridge Assessment International Education), and prepares students for the ICSE (Indian Certificate of Secondary Education) and the IGCSE (International General Certificate of Secondary Education) Year 10 examinations. For Years 11 and 12, we are authorised by the IB (International Baccalaureate) to offer the IB Diploma Programme.`,
      ],
      [
        `JNPV is recognised as a Microsoft Showcase School, thus joining a select league of schools globally for their vision and innovation in teaching, learning, and preparing students for the future.`,
        `The student body, comprising 1,087 students, reflects the cultural diversity of India. The school has 187 teachers, with 27 being expatriates. With a teacher-student ratio of 1:6, every child enjoys individualised attention.`,
        `The School is recognised as India's premier international school, and is also among the top IB schools globally.`,
      ],
    ],
  },
  "Our Inspiration": {
    title: "OUR INSPIRATION",
    image: inspirationImage,
    columns: [
      [
        `At JNPV School, our inspiration comes from the belief that every child is unique, capable, and full of possibilities. Education is not simply about achieving high marks or completing a syllabus; it is about discovering one's strengths, developing confidence, building strong values, and preparing young minds to face the future with courage and responsibility.

         We believe that every student deserves an environment where they feel encouraged to ask questions, explore new ideas, express themselves freely, and learn from their experiences. Our aim is to transform natural curiosity into meaningful learning and help students understand that mistakes are not failures, but valuable opportunities to learn and grow.

         Our inspiration is deeply rooted in the idea of holistic education. Along with academic knowledge, we focus on developing creativity, critical thinking, communication skills, discipline, teamwork, leadership, empathy, and respect for others. We encourage our students to look beyond textbooks and connect their learning with the world around them.`,
      ],
      [
        `At JNPV School, we are inspired by the dreams and aspirations of our students. Every achievement, every new idea, every question, and every small step forward motivates us to create better learning opportunities. We strive to guide students not only toward academic success but also toward becoming confident individuals, responsible citizens, compassionate human beings, and future leaders.

        Our teachers play an important role in this journey. With dedication, patience, and continuous encouragement, they create a supportive atmosphere where students can recognize their potential and work toward their goals. We believe that a great teacher does more than teach a lesson—they inspire a student to believe in themselves.

        We are also inspired by the partnership between students, parents, teachers, and the community. When these four pillars work together, children receive the support and encouragement they need to flourish. Through this strong partnership, we aim to build a school culture based on trust, respect, collaboration, and continuous improvement.`,
      ],
    ],
  },
  "Message from Founder & Chairperson and Vice-Chairperson": {
    title: "MESSAGE FROM FOUNDER & CHAIRPERSON AND VICE-CHAIRPERSON",
    columns: [
      [
        `At JNPV School, we believe that every child has unique potential and deserves the right environment to learn, grow, and succeed. Our aim is to provide quality education along with strong values, confidence, creativity, discipline, and leadership skills.

        We strive to create a learning environment where students are encouraged to explore, think independently, overcome challenges, and develop a lifelong love for learning.`,
      ],
      [
        `We believe that true education goes beyond academics—it shapes character and prepares students to become responsible and compassionate citizens.

          With the dedicated efforts of our teachers, the support of parents, and the enthusiasm of our students, we are committed to building a brighter future for every child.

          Together, let us inspire our students to dream big, learn continuously, and confidently shape a better tomorrow.`,
      ],
    ],
  },
  "Vision, Mission, Motto, Values & Objectives": {
    title: "VISION, MISSION, MOTTO, VALUES & OBJECTIVES",
    columns: [
      [
        ` Our vision is to create a learning environment where every child is encouraged to discover their potential, develop confidence, and grow into a knowledgeable, responsible, and compassionate individual. We aim to prepare students to face the future with courage, creativity, and a strong sense of purpose. 
        Our mission is to provide quality and holistic education that develops students academically, socially, emotionally, and morally. We focus on creating a safe and supportive environment where students can learn with curiosity, think independently, develop essential skills, and build strong values for life.
        Our motto reflects our commitment to helping students gain knowledge, grow as individuals, develop leadership qualities, and inspire others through their actions and achievements.`,
      ],
      [
        `We believe that education must be built on strong values. Honesty, integrity, respect, discipline, compassion, teamwork, creativity, and excellence guide our students in their everyday learning and interactions. These values help them become not only successful learners but also responsible and caring members of society.
        Our objective is to provide students with opportunities to explore their interests, develop their talents, improve their communication and critical-thinking skills, and build confidence. We aim to encourage academic excellence while nurturing character, leadership, creativity, responsibility, and lifelong learning, preparing every student to contribute positively to society.`,
      ],
    ],
  },
  "JNPV Philosophy": {
    title: "JNPV PHILOSOPHY",
    columns: [
      [
        `At JNPV School, we believe that every child is unique and has the potential to achieve great things. Our philosophy is centered on holistic education, where academic knowledge is combined with strong values, creativity, confidence, discipline, and life skills.

        We believe that education should encourage students to think, explore, question, create, and learn from their experiences.`,
      ],
      [
        `Our teachers guide and inspire students to discover their strengths while providing a safe, supportive, and inclusive environment for their overall development.

        We focus on developing knowledgeable minds, strong character, compassionate hearts, and responsible attitudes. Through collaboration between students, teachers, parents, and the community, we aim to prepare young learners to face future challenges with confidence and contribute positively to society. `,
      ],
    ],
  },
  "JNPV Strategic Plan": {
    title: "JNPV STRATEGIC PLAN",
    columns: [
      [
        `The JNPV Strategic Plan is designed to provide a clear direction for the school’s continuous growth and development. Our focus is on creating a strong educational foundation that combines academic excellence, holistic development, innovation, values, and future-ready skills.

          We aim to improve teaching and learning through modern educational approaches, encourage the effective use of technology, and provide students with opportunities to develop their creativity, communication, leadership, and critical-thinking abilities. At the same time, we are committed to supporting our teachers through continuous professional development and creating a positive environment for their growth.`,
      ],
      [
        `Strong collaboration between students, teachers, parents, and the wider community remains an important part of our plan. Through shared responsibility and continuous improvement, we strive to build a school culture based on respect, discipline, integrity, inclusion, and excellence.

        Our strategic plan ultimately aims to ensure that every student receives the guidance, opportunities, and encouragement needed to discover their strengths, overcome challenges, and become confident, responsible, compassionate, and successful individuals prepared for the future.`,
      ],
    ],
  },
  "Unique Features": {
    title: "UNIQUE FEATURES",
    columns: [
      [`At JNPV School, we are committed to providing an educational experience that goes beyond conventional classroom learning. Our approach focuses on the overall development of every child, combining academic excellence with creativity, technology, values, life skills, and personal growth. We believe that every student has unique abilities and deserves the right opportunities, guidance, and encouragement to discover and develop those strengths.

        Our learning environment encourages students to think independently, ask questions, explore new ideas, solve problems, and learn through practical experiences. With dedicated teachers, modern teaching methods, technology-enabled learning, and a strong focus on co-curricular activities, we provide students with opportunities to develop confidence, communication, teamwork, leadership, and creativity.`],
      [`Along with academic knowledge, we emphasize discipline, honesty, respect, compassion, responsibility, and integrity. We believe these values help students become not only successful in their studies and careers but also responsible and caring members of society.

Through strong collaboration between students, teachers, parents, and the community, JNPV School strives to create a safe, inclusive, supportive, and inspiring atmosphere where every child can learn and grow. Our ultimate goal is to prepare students with the knowledge, skills, confidence, character, and adaptability they need to face the future and make a meaningful contribution to the world.`],
    ],
  },
};

export default function AboutUs() {
  const [activeItem, setActiveItem] = useState("About Us");

  return (
    <div className="dais-about">
      <style>{`
        .dais-about {
          font-family: 'Segoe UI', system-ui, sans-serif;
          color: #333;
          background: #fff;
        }

        /* ---------- header ---------- */
        .dais-about .dais-header {
          position: relative;
          background: #1569ad;
        }

        .dais-about .header-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 40px 10px;
        }

        .dais-about .brand {
          display: flex;
          align-items: center;
        }

        .dais-about .brand-logo {
          height: 78px;
          width: auto;
          display: block;
        }

        .dais-about .menu-wrapper {
          position: absolute;
          top: 12px;
          right: 0;
        }

        .dais-about .menu-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(180deg, #f9bb3c, #e89500);
          color: #1a2a40;
          border: none;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.5px;
          padding: 10px 18px;
          cursor: pointer;
        }

        .dais-about .menu-caret {
          font-size: 11px;
          transition: transform 0.2s ease;
        }

        .dais-about .menu-btn.open .menu-caret {
          transform: rotate(180deg);
        }

        .dais-about .menu-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          min-width: 220px;
          background: #fff;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
          z-index: 50;
          overflow: hidden;
        }

        .dais-about .menu-dropdown a {
          display: block;
          padding: 12px 20px;
          color: #1a3a6b;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid #eee;
        }

        .dais-about .menu-dropdown a:hover {
          background: #f5f8fb;
        }

        .dais-about .breadcrumb-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px 26px;
        }

        .dais-about .breadcrumb {
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          margin-bottom: 6px;
        }

        .dais-about .page-title {
          color: #fff;
          font-size: 34px;
          font-weight: 500;
          margin: 0;
        }

        /* ---------- hero image ---------- */
        .dais-about .hero-image {
        width: 79%;
        overflow: hidden;
        margin: 0 auto;
        margin-top: -25px; /* overlap */
        margin-bottom: 20px;
        position: relative;
        z-index: 10; /* bring above header */
        }

        .dais-about .hero-image img {
          width: 100%;
          display: block;
          max-height: 460px;
          object-fit: cover;
        }

        /* ---------- content layout ---------- */
        .dais-about .content-wrap {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: flex-start;
        }

        .dais-about .sidebar {
          width: 280px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
        }

        .dais-about .sidebar-item {
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          background: linear-gradient(180deg, #f9bb3c, #eb9d00);
          color: #1a3a6b;
          font-weight: 600;
          font-size: 15px;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.6);
          padding: 16px 22px;
          cursor: pointer;
          transition: filter 0.15s ease;
        }

        .dais-about .sidebar-item:hover {
          filter: brightness(1.05);
        }

        .dais-about .sidebar-item.active {
          filter: brightness(0.94);
        }

        .dais-about .chevron {
          color: #1a3a6b;
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
        }

        .dais-about .main-content {
          flex: 1;
          padding: 44px 50px;
        }

        .dais-about .section-title {
          color: #2a78b5;
          font-size: 30px;
          font-weight: 500;
          letter-spacing: 0.5px;
          margin: 0 0 22px;
        }

        .dais-about .text-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          font-family: Georgia, 'Times New Roman', serif;
          color: #444;
          font-size: 15px;
          line-height: 1.85;
          text-align: justify;
        }

        .dais-about .text-columns p {
          margin: 0 0 18px;
        }

        /* ---------- parent login ---------- */
        .dais-about .parent-login {
          position: fixed;
          bottom: 24px;
          right: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #9c8563;
          color: #fff;
          border: none;
          padding: 12px 22px 12px 16px;
          border-radius: 6px 0 0 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          z-index: 80;
        }

        .dais-about .parent-login svg {
          width: 16px;
          height: 16px;
        }

        /* ---------- responsive ---------- */
        @media (max-width: 900px) {
          .dais-about .content-wrap {
            flex-direction: column;
          }

          .dais-about .sidebar {
            width: 100%;
          }

          .dais-about .text-columns {
            grid-template-columns: 1fr;
          }

          .dais-about .main-content {
            padding: 32px 24px;
          }
        }

        @media (max-width: 768px) {
          .dais-about .header-inner {
            flex-direction: column;
            justify-content: center;
            padding: 16px 16px 14px;
          }

          .dais-about .brand {
            justify-content: center;
            width: 100%;
            margin-bottom: 20px;
          }

          .dais-about .brand-logo {
            height: 64px;
          }

          .dais-about .menu-wrapper {
            top: 8px;
            right: 8px;
          }

          .dais-about .breadcrumb-wrap {
            display: none;
          }

          .dais-about .sidebar-item {
            font-size: 14px;
            padding: 15px 18px;
          }

          .dais-about .parent-login {
            bottom: 16px;
            padding: 10px 18px 10px 14px;
            font-size: 13px;
          }
        }
      `}</style>

      <header className="dais-header">
        <div className="header-inner">
          <div className="brand">
            <img
              src={schoolLogo}
              alt="Dhirubhai Ambani International School"
              className="brand-logo"
            />
          </div>
        </div>

        <div className="breadcrumb-wrap">
          <h1 className="page-title">About Us</h1>
        </div>
      </header>

      <div className="hero-image">
        <img
          src={sectionContent[activeItem].image ?? schoolBuilding}
          alt={sectionContent[activeItem].title}
        />
      </div>

      <div className="content-wrap">
        <aside className="sidebar">
          {sidebarItems.map((item) => (
            <button
              key={item}
              className={`sidebar-item ${item === activeItem ? "active" : ""}`}
              onClick={() => setActiveItem(item)}
            >
              <span className="chevron">›</span>
              {item}
            </button>
          ))}
        </aside>

        <main className="main-content">
          <h2 className="section-title">{sectionContent[activeItem].title}</h2>

          <div className="text-columns">
            {sectionContent[activeItem].columns.map((column, colIndex) => (
              <div key={colIndex}>
                {column.map((paragraph, pIndex) => (
                  <p key={pIndex}>{paragraph}</p>
                ))}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
