import { useState } from 'react'
import SchoolLogo from '../assets/SchoolLogo.avif'

const menuColumns = [
  {
    links: [
      { label: 'About Us', href: '#' },
      { label: 'Alumni', href: '#' },
      { label: 'Academics', href: '#' },
      { label: 'Admissions', href: '#' },
      { label: 'Awards', href: '#' },
    ],
  },
  {
    links: [
      { label: 'Campus', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Events', href: '#' },
      { label: 'Student Life', href: '#' },
    ],
  },
  {
    links: [
      { label: 'Results & University Placements', href: '#' },
    ],
    showVirtual: true,
  },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="nav-root">
      <style>{`
        .nav-root {
          position: sticky;
          top: 0;
          z-index: 200;
          font-family: 'Segoe UI', system-ui, sans-serif;
          border-bottom: 4px solid #f5a800;
          box-shadow: 0 2px 12px rgba(0,0,0,0.12);
          background: #1a3a6b;
        }

        /* ── Collapsed bar ── */
        .nav-collapsed {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #1a3a6b;
          padding: 0 64px;
          height: 64px;
          max-height: 64px;
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

        .nav-collapsed-name span { color: #f5a800; }

        /* ── MENU button ── */
        .nav-menu-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 22px;
          background: #f5a800;
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

        .nav-menu-btn:hover { background: #e09500; }

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
          background: #fffbee;
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.42s cubic-bezier(0.4,0,0.2,1), opacity 0.32s ease;
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
          padding: 28px 48px;
          gap: 10px;
          flex-shrink: 0;
          min-width: 220px;
        }

        .nav-exp-logo-icon {
          width: 110px;
          height: 110px;
          border-radius: 50%;
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
          color: #f5a800;
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
          grid-template-columns: repeat(3, 1fr);
          column-gap: 48px;
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
        }

        .nav-exp-col a:hover {
          color: #f5a800;
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
        }

        .nav-virtual-btn:hover {
          background: #f5a800 !important;
          color: #1a3a6b !important;
          padding-left: 20px !important;
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
          gap: 5px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 6px;
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
          background: #fffbee;
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease;
        }

        .nav-mobile-menu.open { max-height: 700px; opacity: 1; }

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

        .nav-mobile-menu a:hover {
          background: rgba(245,168,0,0.10);
          color: #f5a800;
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
        }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .nav-collapsed { display: none !important; }
          .nav-expanded { display: none !important; }
          .nav-mobile-toggle { display: flex !important; }
          .nav-mobile-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #1a3a6b;
            padding: 0 20px;
            height: 60px;
          }
          .nav-mobile-menu { display: flex; }
        }

        @media (min-width: 861px) {
          .nav-mobile-bar { display: none !important; }
          .nav-mobile-menu { display: none !important; }
        }
      `}</style>

      {/* Collapsed bar */}
      <div className={`nav-collapsed${menuOpen ? ' hidden' : ''}`}>
        <a href="#" className="nav-collapsed-logo">
          <img src={SchoolLogo} alt="JNPV Logo" className="nav-collapsed-icon" />
          <span className="nav-collapsed-name">JNPV <span>Education</span></span>
        </a>
        <button className="nav-menu-btn" onClick={() => setMenuOpen(true)}>
          MENU <span className="nav-arrow" />
        </button>
      </div>

      {/* Expanded mega menu */}
      <div className={`nav-expanded${menuOpen ? ' open' : ''}`}>
        {/* Logo left */}
        <div className="nav-exp-logo">
          <img src={SchoolLogo} alt="JNPV Logo" className="nav-exp-logo-icon" />
          <div className="nav-exp-logo-text">
            <span className="nav-exp-logo-name">JNPV</span>
            <span className="nav-exp-logo-sub">Education</span>
          </div>
        </div>

        {/* Columns + close right */}
        <div className="nav-exp-right">
          <div className="nav-exp-cols">
            {menuColumns.map((col, i) => (
              <div className="nav-exp-col" key={i}>
                {col.links.map((link) => (
                  <a key={link.label} href={link.href}>{'> '}{link.label}</a>
                ))}
                {col.showVirtual && (
                  <a href="#" className="nav-virtual-btn">Virtual School</a>
                )}
              </div>
            ))}
          </div>

          <div className="nav-exp-bottom">
            <button className="nav-menu-btn" onClick={() => setMenuOpen(false)}>
              MENU <span className="nav-arrow up" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bar */}
      <div className="nav-mobile-bar">
        <a href="#" className="nav-collapsed-logo">
          <img src={SchoolLogo} alt="JNPV Logo" className="nav-collapsed-icon" />
          <span className="nav-collapsed-name">JNPV <span>Education</span></span>
        </a>
        <button
          className="nav-mobile-toggle"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile slide-down */}
      <div className={`nav-mobile-menu${menuOpen ? ' open' : ''}`}>
        {menuColumns.flatMap((c) => c.links).map((link) => (
          <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}>
            {link.label}
          </a>
        ))}
        <a href="#" className="nav-mobile-virtual" onClick={() => setMenuOpen(false)}>
          Virtual School
        </a>
      </div>
    </nav>
  )
}