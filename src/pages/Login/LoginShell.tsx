import styles from './login.module.css';

/** Split layout shared by both sign-in steps, so the frame never jumps. */
export function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <aside className={styles.aside}>
        <div className={styles.brand}>
          <span className={styles.mark}>E</span>
          <span>Evently Admin</span>
        </div>
        <div className={styles.asideBody}>
          <h1 className={styles.asideTitle}>Internal administration console</h1>
          <p className={styles.asideText}>
            Restricted to Evently staff accounts. Sign-in uses the same phone verification as the
            Evently apps.
          </p>
        </div>
        <p className={styles.asideFoot}>Every action here is attributed to your account.</p>
      </aside>

      <main className={styles.panel}>
        <div className={styles.card}>
          <div className={styles.mobileBrand}>
            <span className={styles.mark}>E</span>
            <span>Evently Admin</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
