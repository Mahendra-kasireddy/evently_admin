import { STATUS_LABEL, STATUS_TONE, type OrganizerStatus } from './types';
import styles from './organizers.module.css';

export function StatusPill({ status }: { status: OrganizerStatus }) {
  const tone = STATUS_TONE[status] ?? 'work';
  return <span className={`${styles.pill} ${styles[tone]}`}>{STATUS_LABEL[status] ?? status}</span>;
}

/** Completion meter. The number comes from the API; nothing is estimated here. */
export function Meter({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <span className={styles.meter}>
      <span className={styles.meterTrack}>
        <span className={styles.meterFill} style={{ width: `${clamped}%` }} />
      </span>
      <span className={styles.meterValue}>{clamped}%</span>
    </span>
  );
}
