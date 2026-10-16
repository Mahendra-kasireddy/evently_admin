import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth';
import styles from './adminLayout.module.css';

/**
 * Every section of the console, in the order an admin works through them:
 * the overview first, then the people, then what they are doing, then money,
 * then the inbox.
 *
 * There is no longer a "planned" list — every item here routes to a real
 * screen backed by a real endpoint.
 */
const LIVE_SECTIONS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Users', to: '/users' },
  { label: 'Organizers', to: '/organizers' },
  { label: 'Vendors', to: '/vendors' },
  { label: 'Events', to: '/events' },
  { label: 'Bookings', to: '/bookings' },
  { label: 'Payments', to: '/payments' },
  { label: 'Coupons', to: '/coupons' },
  { label: 'Contact Us', to: '/contact-us' },
  { label: 'App setup', to: '/setup' },
];

function initials(name: string, fallback: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || fallback;
}

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close the profile menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const name = user?.name?.trim() || 'Administrator';
  const contact = user?.email || (user?.phone ? `+91 ${user.phone}` : '');

  async function onSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <button
            className={styles.navToggle}
            type="button"
            onClick={() => setNavOpen((open) => !open)}
            aria-expanded={navOpen}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <span className={styles.mark}>E</span>
          <span className={styles.brandLabel}>
            <span>Evently</span>
            <span className={styles.brandTag}>Admin</span>
          </span>
        </div>

        <div className={styles.profile} ref={profileRef}>
          <button
            className={styles.profileButton}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <span className={styles.avatar} aria-hidden="true">
              {initials(name, 'AD')}
            </span>
            <span className={styles.profileName}>{name}</span>
            <span className={styles.caret} aria-hidden="true">
              ▼
            </span>
          </button>

          {menuOpen ? (
            <div className={styles.menu} role="menu">
              <div className={styles.menuHead}>
                <p className={styles.menuName}>{name}</p>
                {contact ? <p className={styles.menuMeta}>{contact}</p> : null}
                <span className={styles.menuRole}>Admin</span>
              </div>
              <button className={styles.menuItem} type="button" role="menuitem" disabled>
                Profile settings — coming soon
              </button>
              <button
                className={`${styles.menuItem} ${styles.signOut}`}
                type="button"
                role="menuitem"
                onClick={onSignOut}
                disabled={signingOut}
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className={styles.body}>
        <nav
          className={`${styles.sidebar} ${navOpen ? '' : styles.sidebarHidden}`}
          aria-label="Sections"
        >
          <p className={styles.sideLabel}>Console</p>
          <ul className={styles.navList}>
            {LIVE_SECTIONS.map((section) => (
              <li key={section.to}>
                <NavLink
                  to={section.to}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navActive : ''}`
                  }
                  onClick={() => {
                    // Collapse the mobile drawer on navigation, without an effect.
                    setNavOpen(false);
                    setMenuOpen(false);
                  }}
                >
                  {section.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
