import { useState } from 'react';
import schoolLogo from '../assets/SchoolLogo.avif';
import schoolBuilding from '../assets/Img1.webp';
import campus1 from '../assets/Campus1.webp';
import campus2 from '../assets/Campus2.webp';
import campus3 from '../assets/Campus3.webp';
import campus4 from '../assets/Campus4.webp';
import campus5 from '../assets/Campus5.webp';
import campus6 from '../assets/Campus6.webp';

export default function Campus() {
  const [activeItem, setActiveItem] = useState('Camppus');

  const leftFacilities = [
    'Unique open school design',
    'Well-equipped, IT-enabled classrooms with multimedia projectors',
    'State-of-the-art Computer, Physics, Chemistry, Biology and Mathematics laboratories',
    'Multipurpose Auditorium',
    'A modern Centre for Performing Arts',
    'Special Activity rooms for Art, Music (Western & Indian), Dance, Drama and Yoga',
    'Purpose-built play areas for pre-primary and primary',
  ];

  const rightFacilities = [
    'Sporting facilities: Basketball, Tennis, Table-tennis, Badminton, Cricket and Judo',
    'AstroTurf football field',
    'Medical Centre with qualified nurses and a doctor',
    'Learning Centre with 38,200 books, 40 journals and magazines, 1600 multimedia (CD/DVD/Audio Cassettes), and 16 online databases',
    'Wi-Fi enabled campus',
    'Cafeteria: Ultra-modern kitchen and two dining halls',
    'Energy conservation initiatives like LED lighting, air-conditioning timetable, solar-powered water heaters; water conservation efforts; waste-paper management',
    'Safe campus with modern security systems',
  ];

  const campusPhotos = [campus1, campus2, campus3, campus4, campus5, campus6];

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
        }

        .dais-about .main-content {
          padding: 0 50px 50px;
        }

        .dais-about .section-title {
          color: #2a78b5;
          font-size: 30px;
          font-weight: 500;
          letter-spacing: 0.5px;
          margin: 0 0 22px;
        }

        /* ---------- intro info box ---------- */
        .dais-about .intro-box {
          background: linear-gradient(180deg, #f9c95c, #f4ad1f);
          color: #5a3d00;
          font-size: 14px;
          line-height: 1.7;
          padding: 18px 24px;
          margin-bottom: 28px;
        }

        .dais-about .intro-box p {
          margin: 0;
        }

        /* ---------- video / cover ---------- */
        .dais-about .video-wrap {
          position: relative;
          margin-bottom: 30px;
          overflow: hidden;
          cursor: pointer;
        }

        .dais-about .video-wrap img {
          width: 100%;
          display: block;
          max-height: 360px;
          object-fit: cover;
        }

        .dais-about .play-button {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 64px;
          height: 44px;
          background: #ff0000;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dais-about .play-button::after {
          content: '';
          border-style: solid;
          border-width: 10px 0 10px 16px;
          border-color: transparent transparent transparent #fff;
        }

        /* ---------- facilities ---------- */
        .dais-about .facilities-title {
          font-size: 15px;
          font-weight: 700;
          color: #1a3a6b;
          margin: 0 0 14px;
        }

        .dais-about .facilities-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 40px;
          margin-bottom: 36px;
        }

        .dais-about .facilities-columns ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .dais-about .facilities-columns li {
          position: relative;
          padding-left: 16px;
          margin-bottom: 12px;
          font-size: 13.5px;
          line-height: 1.6;
          color: #333;
        }

        .dais-about .facilities-columns li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 6px;
          width: 7px;
          height: 7px;
          background: #e8a400;
        }

        /* ---------- photo grid 3+3 ---------- */
        .dais-about .photo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .dais-about .photo-grid .photo-item {
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
        }

        .dais-about .photo-grid .photo-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* ---------- responsive ---------- */
        @media (max-width: 900px) {
          .dais-about .main-content {
            padding: 0 24px 36px;
          }

          .dais-about .facilities-columns {
            grid-template-columns: 1fr;
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

          .dais-about .photo-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .dais-about .photo-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }
      `}</style>

      <header className="dais-header">
        <div className="header-inner">
          <div className="brand">
            <img
              src={schoolLogo}
              alt="Jawaharlal Nehru Port Vidyalaya building"
              className="brand-logo"
            />
          </div>
        </div>

        <div className="breadcrumb-wrap">
          <h1 className="page-title">Campus</h1>
        </div>
      </header>

      <div className="hero-image">
        <img
          src={schoolBuilding}
          alt="Jawaharlal Nehru Port Vidyalaya building"
        />
      </div>

      <div className="content-wrap">
        <main className="main-content">
          <h2 className="section-title">CAMPUS</h2>

          <div className="intro-box">
            <p>
              Jawaharlal Nehru Port Vidyalaya  is situated at
              WX3H+282, Sector 3, Jaskhar, Maharashtra 400707. which is a fast growing business district
              in Mumbai. Just off Bandra-Kurla Complex Road, it is accessible
              to students living in different parts of the city.
            </p>
          </div>


          <div className="facilities-columns">
            <div>
              <p className="facilities-title">Infrastructure and Facilities</p>
              <ul>
                {leftFacilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="facilities-title">&nbsp;</p>
              <ul>
                {rightFacilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="photo-grid">
            {campusPhotos.map((photo, index) => (
              <div className="photo-item" key={index}>
                <img src={photo} alt={`Campus view ${index + 1}`} />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}