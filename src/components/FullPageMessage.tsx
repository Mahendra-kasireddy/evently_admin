import styles from './FullPageMessage.module.css';

/**
 * Centred full-viewport state. Used for the session-restore spinner and for the
 * hard configuration error, both of which happen before any layout exists.
 */
export function FullPageMessage({
  title,
  detail,
  spinner = false,
}: {
  title: string;
  detail?: string;
  spinner?: boolean;
}) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      {spinner ? <span className={styles.spinner} aria-hidden="true" /> : null}
      <p className={styles.title}>{title}</p>
      {detail ? <p className={styles.detail}>{detail}</p> : null}
    </div>
  );
}
