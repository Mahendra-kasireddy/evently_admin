import { useState } from 'react';
import type { FieldSpec, MetadataItem, MetadataType } from '../../features/metadata/types';
import styles from '../Organizers/detail.module.css';

/**
 * One setup option, as a form — built from the type's field list, so every
 * kind of option (city, occasion, category…) is edited the same way.
 *
 * Creating asks for the natural key; editing does not, because organizers,
 * plans and bookings already store it. The server re-validates everything;
 * this only stops an obviously incomplete form from being sent.
 */
export function ItemForm({
  spec,
  existing,
  busy,
  onCancel,
  onSubmit,
}: {
  spec: MetadataType;
  existing?: MetadataItem | undefined;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (body: Record<string, unknown>) => void;
}) {
  const creating = !existing;
  const [key, setKey] = useState('');
  const [order, setOrder] = useState(existing ? String(existing.order) : '');
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(spec.fields.map((f) => [f.name, initial(f, existing)])),
  );

  const set = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));
  const missing = spec.fields.some((f) => f.required && !values[f.name]?.trim());
  const ready = (!creating || key.trim().length > 0) && !missing && !busy;

  function submit() {
    const body: Record<string, unknown> = {};
    if (creating) body[spec.keyField] = key.trim();
    for (const f of spec.fields) {
      const raw = values[f.name] ?? '';
      body[f.name] = f.kind === 'list' ? raw.split(',').map((s) => s.trim()).filter(Boolean) : raw;
    }
    if (order.trim() !== '') body.order = Number(order);
    onSubmit(body);
  }

  return (
    <div className={styles.dialog}>
      <p className={styles.dialogTitle}>
        {creating ? `New ${singular(spec.label)}` : `Edit “${existing.key}”`}
      </p>
      <p className={styles.dialogNote}>
        {creating
          ? spec.keyIsSlug
            ? `The ${spec.keyField} is a permanent id (lowercase, e.g. "naming_ceremony"). It cannot be changed later.`
            : `The ${spec.keyField} is what customers see and cannot be changed later.`
          : `The ${spec.keyField} cannot be changed — other records refer to it. To retire this option, deactivate it.`}
      </p>

      <div className={styles.editGrid}>
        {creating ? (
          <Field label={`${capitalise(spec.keyField)} *`}>
            <input
              className={styles.input}
              value={key}
              maxLength={60}
              placeholder={spec.keyIsSlug ? 'e.g. naming_ceremony' : 'e.g. Vijayawada'}
              onChange={(event) =>
                setKey(spec.keyIsSlug ? event.target.value.toLowerCase() : event.target.value)
              }
            />
          </Field>
        ) : null}

        {spec.fields.map((f) => (
          <Field key={f.name} label={f.required ? `${f.label} *` : f.label} hint={f.hint}>
            {f.kind === 'select' ? (
              <select
                className={styles.input}
                value={values[f.name]}
                onChange={(event) => set(f.name, event.target.value)}
              >
                <option value="">Choose…</option>
                {(f.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className={styles.input}
                value={values[f.name]}
                maxLength={f.kind === 'list' ? 600 : f.maxLength}
                placeholder={f.kind === 'list' ? 'comma, separated, words' : ''}
                onChange={(event) => set(f.name, event.target.value)}
              />
            )}
          </Field>
        ))}

        <Field label="Order" hint="Lower numbers show first. Leave empty to add at the end.">
          <input
            className={styles.input}
            value={order}
            inputMode="numeric"
            onChange={(event) => setOrder(event.target.value.replace(/[^0-9]/g, ''))}
          />
        </Field>
      </div>

      <div className={styles.dialogActions}>
        <button type="button" className={styles.btn} onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.approve}`}
          onClick={submit}
          disabled={!ready}
        >
          {busy ? 'Saving…' : creating ? 'Add' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function initial(f: FieldSpec, existing?: MetadataItem): string {
  const v = existing?.values[f.name];
  if (Array.isArray(v)) return v.join(', ');
  return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.editField}>
      <span className={styles.editLabel}>{label}</span>
      {children}
      {hint ? <span className={styles.dialogNote}>{hint}</span> : null}
    </label>
  );
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function singular(label: string): string {
  const lower = label.toLowerCase();
  if (lower.endsWith('ies')) return `${lower.slice(0, -3)}y`;
  return lower.endsWith('s') ? lower.slice(0, -1) : lower;
}
