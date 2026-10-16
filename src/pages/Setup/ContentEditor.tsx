import { useState } from 'react';
import { resetContent, saveContent } from '../../features/metadata/service';
import type { ContentDoc } from '../../features/metadata/types';
import { errorMessage } from '../../lib/api/errors';
import { Pill } from '../../features/shared/ListChrome';
import styles from '../Organizers/detail.module.css';
import setup from './setup.module.css';

/**
 * The Home / Plan copy, edited as JSON.
 *
 * It is a nested document (headings, lists of options, trust lines…), so the
 * honest editor is the document itself rather than a form that would have to
 * know every shape. Invalid JSON is caught here; the server checks the rest.
 */
export function ContentEditor({
  doc,
  onSaved,
}: {
  doc: ContentDoc;
  onSaved: (next: ContentDoc) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(doc.data, null, 2));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const original = JSON.stringify(doc.data, null, 2);
  const dirty = text !== original;

  async function save() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError('That is not valid JSON — check for a missing comma or quote.');
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const next = await saveContent(doc.key, parsed);
      setText(JSON.stringify(next.data, null, 2));
      setNotice('Saved. The app shows this copy from now on.');
      onSaved(next);
    } catch (cause: unknown) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!window.confirm(`Replace “${doc.label}” with the built-in default? Your edits will be lost.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const next = await resetContent(doc.key);
      setText(JSON.stringify(next.data, null, 2));
      setNotice('Reset to the built-in default and saved.');
      onSaved(next);
    } catch (cause: unknown) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.dialog}>
      <div className={setup.contentHead}>
        <p className={styles.dialogTitle}>{doc.label}</p>
        {doc.saved ? (
          <Pill label="Saved in database" tone="good" />
        ) : (
          <Pill label="Using built-in default" tone="wait" />
        )}
      </div>
      <p className={styles.dialogNote}>
        {doc.saved
          ? 'This is the live copy the app reads.'
          : 'Nothing is saved for this yet, so the app is showing the built-in default below. Save it to make it the live copy.'}
      </p>

      {error ? (
        <p className={`${styles.banner} ${styles.bannerBad}`} role="alert">
          {error}
        </p>
      ) : null}
      {notice ? <p className={`${styles.banner} ${styles.bannerGood}`}>{notice}</p> : null}

      <textarea
        className={`${styles.textarea} ${setup.json}`}
        value={text}
        spellCheck={false}
        onChange={(event) => setText(event.target.value)}
      />

      <div className={styles.dialogActions}>
        <button type="button" className={styles.btn} onClick={() => void reset()} disabled={busy}>
          Reset to default
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.approve}`}
          onClick={() => void save()}
          disabled={busy || (doc.saved && !dirty)}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
