import type { ReactNode } from 'react';
import styles from '../organizers/organizers.module.css';

/** Page heading block, identical across every section. */
export function ListHead({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className={styles.head}>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </div>
  );
}

export interface ChipDef {
  /** The URL param this chip writes, e.g. 'status'. */
  param: string;
  value: string;
  label: string;
  /** Key into the counts map; defaults to `value`. */
  countKey?: string;
}

/**
 * Search box plus filter chips. Chips write their own param into the URL, so a
 * filtered list is always a shareable link.
 */
export function ListControls({
  searchPlaceholder,
  draft,
  onSearchChange,
  chips,
  counts,
  activeParams,
  setParam,
}: {
  searchPlaceholder: string;
  draft: string;
  onSearchChange: (value: string) => void;
  chips: ChipDef[];
  counts: Record<string, number> | null;
  /** Current value of each filter param, so a chip knows if it's on. */
  activeParams: Record<string, string | null>;
  setParam: (patch: Record<string, string | null>) => void;
}) {
  const anyActive = Object.values(activeParams).some(Boolean);
  const clearAll: Record<string, string | null> = { page: null };
  for (const key of Object.keys(activeParams)) clearAll[key] = null;

  return (
    <div className={styles.controls}>
      <input
        className={styles.search}
        type="search"
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        value={draft}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <div className={styles.chips} role="group" aria-label="Filters">
        <button
          type="button"
          className={`${styles.chip} ${!anyActive ? styles.chipOn : ''}`}
          onClick={() => setParam(clearAll)}
        >
          All
          {counts ? <span className={styles.chipCount}>{counts.all ?? 0}</span> : null}
        </button>
        {chips.map((chip) => {
          const on = activeParams[chip.param] === chip.value;
          return (
            <button
              key={`${chip.param}:${chip.value}`}
              type="button"
              className={`${styles.chip} ${on ? styles.chipOn : ''}`}
              onClick={() =>
                // Selecting one filter clears the others, so the chips can
                // never claim a combination the list is not actually showing.
                setParam({ ...clearAll, [chip.param]: on ? null : chip.value })
              }
            >
              {chip.label}
              {counts ? (
                <span className={styles.chipCount}>{counts[chip.countKey ?? chip.value] ?? 0}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Loading / empty / table, with the states never left blank. */
export function ListBody({
  loading,
  isEmpty,
  loadingLabel,
  emptyTitle,
  emptyHint,
  children,
}: {
  loading: boolean;
  isEmpty: boolean;
  loadingLabel: string;
  emptyTitle: string;
  emptyHint: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.tableWrap}>
      {loading ? (
        <div className={styles.empty} role="status">
          <p className={styles.emptyTitle}>{loadingLabel}</p>
        </div>
      ) : isEmpty ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{emptyTitle}</p>
          <p className={styles.emptyHint}>{emptyHint}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function Pager({
  total,
  from,
  to,
  page,
  pages,
  setParam,
}: {
  total: number;
  from: number;
  to: number;
  page: number;
  pages: number;
  setParam: (patch: Record<string, string | null>) => void;
}) {
  if (total === 0) return null;
  return (
    <div className={styles.pager}>
      <span>
        {from}–{to} of {total}
      </span>
      <div className={styles.pagerBtns}>
        <button
          type="button"
          className={styles.pagerBtn}
          disabled={page <= 1}
          onClick={() => setParam({ page: String(page - 1) })}
        >
          Previous
        </button>
        <button
          type="button"
          className={styles.pagerBtn}
          disabled={page >= pages}
          onClick={() => setParam({ page: String(page + 1) })}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function ListError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className={styles.error} role="alert">
      {error}
    </p>
  );
}

/** A status pill in one of the stylesheet's existing tones. */
export function Pill({
  label,
  tone,
}: {
  label: string;
  tone: 'wait' | 'work' | 'review' | 'good' | 'bad';
}) {
  return <span className={`${styles.pill} ${styles[tone]}`}>{label}</span>;
}
