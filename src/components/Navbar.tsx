import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SchoolLogo from '../assets/SchoolLogo.avif'

const menuColumns = [
  {
    links: [
      { label: 'About Us', href: '/about-us' },
      { label: 'Alumni', href: '/alumni' },
      { label: 'Academics', href: '/academics' },
      { label: 'Admissions', href: '/admissions' },
    ],
  },
  {
    links: [
      { label: 'Campus', href: '/campus' },
      // { label: 'Careers', href: '/careers' },
      { label: 'Events & News', href: '/events' },
      { label: 'Student Life', href: '/student-life' },
      { label: 'Awards', href: '/awards' },
    ],
  },
  {
    links: [
      { label: 'Exam and Result', href: '/exam-and-result' },
    ],
    showVirtual: true,
  },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  const handleNav = (href: string) => {
    setMenuOpen(false)
    navigate(href)
  }
  return (
    <nav className='nav-root'
      onMouseEnter={() => !isHome && setMenuOpen(true)}
      onMouseLeave={() => !isHome && setMenuOpen(false)}
    >
      <style>{`
        .nav-root {
          position: sticky;
          top: 0;
          z-index: 200;
          font-family: 'Segoe UI', system-ui, sans-serif;
          border-bottom: 8px solid #ffcc00;
          box-shadow: 0 2px 12px rgba(0,0,0,0.12);
          background:transparent;
        }

        /* ── Collapsed bar ── */
        .nav-collapsed {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #1a3a6b;
          padding: 0 64px;
          height: 60px;
          max-height: 60px;
          overflow: hidden;
          opacity: 1;
          transition: max-height 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease;
        }

        .nav-collapsed.hidden {
          max-height: 0;
          opacity: 0;
          pointer-events: none;
        }

        .nav-collapsed-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .nav-collapsed-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: contain;
          flex-shrink: 0;
          background: #1a3a6b;
        }

        .nav-collapsed-name {
          font-size: 17px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.5px;
        }

        .nav-collapsed-name span { color: #ffcc00; }

        @media (max-width: 860px) {
          .nav-root { background: transparent; }   /* added */
          .nav-collapsed { display: none !important; }
          .nav-expanded { display: none !important; }
          .nav-mobile-toggle {
            display: flex !important;
            position: absolute;
            right: 20px;
            bottom: -36px;
            z-index: 250;
          }
          .nav-mobile-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #1a3a6b;
            padding: 0 20px;
            height: 0;
          }
          .nav-mobile-menu { display: flex; }
        }
  

        /* ── MENU button ── */
        .nav-menu-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 22px;
          background: #ffcc00;
          color: #1a3a6b;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.18s;
        }

        .nav-menu-btn:hover { background: #ffba00; }

        .nav-arrow {
          display: inline-block;
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid #1a3a6b;
          transition: transform 0.3s ease;
        }

        .nav-arrow.up { transform: rotate(180deg); }

        /* ── Expanded mega panel ── */
        .nav-expanded {
          display: flex;
          align-items: stretch;
          background: #FFFFFF;
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          z-index: 150;
            transition:
    max-height 3s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.8s ease;
        }

        .nav-expanded.open {
          max-height: 380px;
          opacity: 1;
        }

        /* Left: logo block */
        .nav-exp-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 28px 48px 28px 200px;
          gap: 10px;
          flex-shrink: 0;
          min-width: 260px;
        }

        .nav-exp-logo-icon {
          width: 130px;
          height: 130px;
          border-radius: 0;
          object-fit: contain;
        }

        .nav-exp-logo-text { text-align: center; }

        .nav-exp-logo-name {
          font-size: 18px;
          font-weight: 900;
          color: #1a3a6b;
          letter-spacing: 1px;
          display: block;
        }

        .nav-exp-logo-sub {
          font-size: 10px;
          font-weight: 600;
          color: #ffcc00;
          letter-spacing: 2px;
          text-transform: uppercase;
          display: block;
          margin-top: 3px;
        }

        /* Right: columns + bottom close btn */
        .nav-exp-right {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 28px 64px 20px 48px;
        }

        .nav-exp-cols {
          display: grid;
          grid-template-columns: repeat(3, max-content);
           column-gap: 190px;
          justify-content: center;
          flex: 1;
        }

        .nav-exp-col { padding: 0; }

        .nav-exp-col a {
          display: block;
          padding: 7px 0;
          color: #1a3a6b;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.4px;
          text-transform: uppercase;
          transition: color 0.15s, padding-left 0.15s;
          white-space: nowrap;
          cursor: pointer;
          background: none;
          border: none;
          text-align: left;
          width: 100%;
          font-family: inherit;
        }

        .nav-exp-col a:hover {
          color: #ffcc00;
          padding-left: 5px;
        }

        /* Virtual school CTA */
        .nav-virtual-btn {
          display: inline-block !important;
          margin-top: 14px;
          padding: 9px 20px !important;
          background: #1a3a6b !important;
          color: #ffffff !important;
          font-size: 12px !important;
          font-weight: 800 !important;
          letter-spacing: 1px;
          text-transform: uppercase !important;
          border-radius: 3px;
          transition: background 0.18s !important;
          white-space: nowrap;
          text-decoration: none;
        }

        .nav-virtual-btn:hover {
          background: #ffcc00 !important;
          color: #1a3a6b !important;
        }

        .nav-exp-bottom {
          display: flex;
          justify-content: flex-end;
          padding-top: 14px;
        }

        /* ── Mobile ── */
            .nav-mobile-toggle {
          display: none;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          background: #ffcc00;   /* changed: none → #ffcc00, same as desktop MENU button */
          border: none;
          border-radius: 4px;     /* added: small rounding so it reads as a button like desktop */
          padding: 10px 12px;     /* changed: 6px → 10px 12px, proper tap-target size to match button look */
        }

        .nav-mobile-toggle span {
          display: block;
          width: 24px;
          height: 2px;
          background: #ffffff;
          border-radius: 2px;
          transition: all 0.25s;
        }

        .nav-mobile-menu {
          display: none;
          flex-direction: column;
          background: #FFFFFF;
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease;
        }

        .nav-mobile-menu.open { max-height: 500px; opacity: 1; }

        .nav-mobile-menu a {
          display: block;
          padding: 12px 24px;
          color: #1a3a6b;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1px solid rgba(26,58,107,0.08);
          transition: background 0.15s, color 0.15s;
        }

        .nav-mobile-virtual {
          margin: 12px 24px 20px;
          display: inline-block;
          padding: 10px 20px;
          background: #1a3a6b;
          color: #ffffff !important;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          border-radius: 3px;
          border-bottom: none !important;
          width: fit-content;
          text-decoration: none;
        }

        .nav-menu-float {
          position: absolute;
          right: 64px;
          bottom: -37px;
          z-index: 250;
        }

        @media (max-width: 860px) {
          .nav-menu-float { display: none !important; }
        }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .nav-collapsed { display: none !important; }
          .nav-expanded { display: none !important; }
          .nav-mobile-toggle {
          display: flex !important;
          position: absolute;   /* added */
          right: 20px;           /* added */
          bottom: -36px;         /* added — same float-down amount as desktop's nav-menu-float */
          z-index: 250;          /* added */
        }
          .nav-mobile-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #1a3a6b;
            padding: 0 20px;
            height: 0;
          }
          .nav-mobile-menu { display: flex; }
        }

        @media (min-width: 861px) {
          .nav-mobile-bar { display: none !important; }
          .nav-mobile-menu { display: none !important; }
        }
      `}</style>

      {/* Expanded mega menu */}
      {/* Expanded mega menu */}
      <div>
        <div className={`nav-expanded${menuOpen ? " open" : ""}`}>
          {/* Logo left */}
          <div className='nav-exp-logo'>
            <img src={SchoolLogo} alt='JNPV Logo' onClick={()=> navigate("/")} className='nav-exp-logo-icon' />
            <div className='nav-exp-logo-text'>
              <span className='nav-exp-logo-name'>JNPV</span>
              <span className='nav-exp-logo-sub'>Education</span>
            </div>
          </div>

          {/* Columns + close right */}
          <div className='nav-exp-right'>
            <div className='nav-exp-cols'>
              {menuColumns.map((col, i) => (
                <div className='nav-exp-col' key={i}>
                  {col.links.map((link) => (
                    <a key={link.label} onClick={() => handleNav(link.href)}>
                      {"● "}
                      {link.label}
                    </a>
                  ))}
                  {/* {col.showVirtual && (
                    <a href="#" className="nav-virtual-btn">Virtual School</a>
                  )} */}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          className='nav-menu-btn nav-menu-float'
          onClick={() => isHome && setMenuOpen((o) => !o)}
        >
          MENU <span className={`nav-arrow${menuOpen ? " up" : ""}`} />
        </button>
      </div>

      {/* Mobile bar */}
      <div className='nav-mobile-bar'>
        <button
          className='nav-mobile-toggle'
          onClick={() => setMenuOpen((o) => !o)}
          aria-label='Toggle menu'
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile slide-down */}
      <div className={`nav-mobile-menu${menuOpen ? " open" : ""}`}>
        {menuColumns
          .flatMap((c) => c.links)
          .map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
      </div>
    </nav>
  );
}
