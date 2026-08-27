import { STATUS_LABEL, STATUS_TONE, type ContactStatus } from './types';
import styles from '../organizers/organizers.module.css';

/** Reuses the organizers stylesheet's pill tones — one visual language. */
export function ContactStatusPill({ status }: { status: ContactStatus }) {
  const tone = STATUS_TONE[status] ?? 'work';
  return <span className={`${styles.pill} ${styles[tone]}`}>{STATUS_LABEL[status] ?? status}</span>;
}
