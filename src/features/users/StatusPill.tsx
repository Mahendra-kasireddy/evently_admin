import { ROLE_LABEL, STATUS_LABEL, STATUS_TONE, type UserRole, type UserStatus } from './types';
import styles from '../organizers/organizers.module.css';

/** Reuses the organizers stylesheet's pill tones — one visual language. */
export function UserStatusPill({ status }: { status: UserStatus }) {
  const tone = STATUS_TONE[status] ?? 'work';
  return <span className={`${styles.pill} ${styles[tone]}`}>{STATUS_LABEL[status] ?? status}</span>;
}

/**
 * An account can hold several roles at once (a customer who also organizes),
 * so this renders every one rather than picking a primary.
 */
export function RoleTags({ roles }: { roles: UserRole[] }) {
  if (roles.length === 0) return <span className={styles.mutedCell}>None</span>;
  return (
    <span className={styles.roleTags}>
      {roles.map((r) => (
        <span key={r} className={styles.roleTag}>
          {ROLE_LABEL[r] ?? r}
        </span>
      ))}
    </span>
  );
}
