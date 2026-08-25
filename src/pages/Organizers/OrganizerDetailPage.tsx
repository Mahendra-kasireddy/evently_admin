import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { errorMessage } from '../../lib/api/errors';
import {
  approveOrganizer,
  getOrganizer,
  rejectOrganizer,
  requestChanges,
  updateOnboarding,
} from '../../features/organizers/service';
import {
  ACTION_LABEL,
  ADMIN_EDITABLE,
  STATUS_LABEL,
  type OnboardingView,
  type OrganizerDetail,
} from '../../features/organizers/types';
import { Meter, StatusPill } from '../../features/organizers/StatusPill';
import { formatDate, formatMobile, orNotProvided } from '../../features/organizers/format';
import { FullPageMessage } from '../../components/FullPageMessage';
import list from '../../features/organizers/organizers.module.css';
import styles from './detail.module.css';

type Dialog = 'reject' | 'changes' | null;

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  const empty = !value.trim();
  return (
    <div className={`${styles.field} ${wide ? styles.wide : ''}`}>
      <p className={styles.fieldLabel}>{label}</p>
      <p className={`${styles.fieldValue} ${empty ? styles.fieldEmpty : ''}`}>
        {empty ? 'Not provided' : value}
      </p>
    </div>
  );
}

const listOf = (values: string[]): string => (values.length ? values.join(', ') : '');
const money = (value: number): string => (value > 0 ? `₹${value.toLocaleString('en-IN')}` : '');

/** Documents are links to whatever the organizer uploaded — never fabricated. */
function Docs({ files }: { files: Array<{ label: string; file: OnboardingView['panFile'] }> }) {
  const present = files.filter((f) => f.file?.url);
  if (present.length === 0) return null;
  return (
    <div className={styles.docs}>
      {present.map(({ label, file }) => (
        <a
          key={label}
          className={styles.doc}
          href={file!.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          {label}
          {file!.originalName ? ` · ${file!.originalName}` : ''}
        </a>
      ))}
    </div>
  );
}

/**
 * One organizer, end to end: account, the onboarding they entered, the
 * decisions available at their current state, and the audit trail.
 *
 * Everything rendered comes from `GET /admin/organizer/getOrganizerById/:id`,
 * whose onboarding payload is built by the organizer's own view builder — so
 * this screen cannot drift from what the organizer sees.
 */
export function OrganizerDetailPage() {
  const { id = '' } = useParams();

  /**
   * Stamped with the id it describes, so `loading` is derived and the fetch
   * effect writes state only from settled promises — never synchronously.
   */
  const [loaded, setLoaded] = useState<{
    id: string;
    detail: OrganizerDetail | null;
    error: string | null;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reason, setReason] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [editNote, setEditNote] = useState<string | null>(null);

  const loading = loaded?.id !== id;
  const detail = loaded?.id === id ? loaded.detail : null;
  const error = loaded?.id === id ? loaded.error : null;

  useEffect(() => {
    const controller = new AbortController();
    getOrganizer(id, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setLoaded({ id, detail: data, error: null });
        setEdits({});
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setLoaded({ id, detail: null, error: errorMessage(cause) });
      });
    return () => controller.abort();
  }, [id]);

  async function run(work: () => Promise<OrganizerDetail>, onDone?: () => void) {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const next = await work();
      setLoaded({ id, detail: next, error: null });
      setEdits({});
      onDone?.();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (loading && !detail) return <FullPageMessage title="Loading organizer…" spinner />;
  if (error && !detail) {
    return (
      <div>
        <Link className={styles.back} to="/organizers">
          ← Organizers
        </Link>
        <p className={list.error} role="alert">
          {error}
        </p>
      </div>
    );
  }
  if (!detail) return null;

  const o = detail.onboarding;
  const status = detail.status;
  const canApprove = status === 'pending_review' || status === 'submitted' || status === 'rejected';
  const approveLabel =
    status === 'pending_review'
      ? 'Approve registration'
      : status === 'rejected'
        ? 'Reopen registration'
        : 'Approve organizer';
  const canRequestChanges = status === 'submitted' || status === 'approved';
  const canReject = status !== 'rejected';
  const outstanding = detail.reviewTrail.find(
    (e) => e.action === 'rejected' || e.action === 'changes_requested',
  );

  const dirtyKeys = Object.keys(edits).filter((key) => {
    const current = (o as unknown as Record<string, unknown>)[key];
    return edits[key] !== String(current ?? '');
  });

  function submitEdits() {
    const patch: Record<string, string | number> = {};
    for (const key of dirtyKeys) {
      const spec = ADMIN_EDITABLE.find((f) => f.key === key);
      const raw = edits[key] ?? '';
      if (spec?.kind === 'number') {
        const n = Number(raw);
        if (raw.trim() === '' || Number.isNaN(n)) continue;
        patch[key] = n;
      } else {
        patch[key] = raw;
      }
    }
    if (Object.keys(patch).length === 0) return;
    const fieldCount = Object.keys(patch).length;
    void run(
      () => updateOnboarding(detail!.id, patch),
      () => setEditNote(`Saved ${fieldCount} field${fieldCount === 1 ? '' : 's'}.`),
    );
  }

  return (
    <div className={styles.page}>
      {/* Stays put: who this is, what state they're in, and the decisions. */}
      <div className={styles.top}>
        <Link className={styles.back} to="/organizers">
          ← Organizers
        </Link>

        <div className={styles.header}>
          <div>
            <h1 className={styles.name}>{orNotProvided(o.businessName)}</h1>
            <div className={styles.metaRow}>
              <StatusPill status={status} />
              <span className={styles.mono}>{formatMobile(detail.mobile)}</span>
              <span className={styles.dot}>Registered {formatDate(detail.registeredAt)}</span>
              {detail.submittedAt ? (
                <span className={styles.dot}>Submitted {formatDate(detail.submittedAt)}</span>
              ) : null}
              {detail.live ? <span className={styles.liveTag}>Live to customers</span> : null}
            </div>
          </div>

          <div>
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.approve}`}
                disabled={!canApprove || busy}
                onClick={() => void run(() => approveOrganizer(detail.id))}
              >
                {busy ? 'Working…' : approveLabel}
              </button>
              <button
                type="button"
                className={styles.btn}
                disabled={!canRequestChanges || busy}
                onClick={() => {
                  setReason('');
                  setDialog('changes');
                }}
              >
                Request changes
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.danger}`}
                disabled={!canReject || busy}
                onClick={() => {
                  setReason('');
                  setDialog('reject');
                }}
              >
                Reject
              </button>
            </div>
            {!canApprove ? (
              <p className={styles.blocked}>
                Nothing to approve while this organizer is {STATUS_LABEL[status].toLowerCase()}.
              </p>
            ) : null}
          </div>
        </div>

        {actionError ? (
          <p className={`${styles.banner} ${styles.bannerBad}`} role="alert">
            {actionError}
          </p>
        ) : null}

        {status === 'rejected' && outstanding ? (
          <p className={`${styles.banner} ${styles.bannerBad}`}>
            <strong>Rejected.</strong> {outstanding.reason}
          </p>
        ) : null}
        {status === 'changes_requested' && outstanding ? (
          <p className={`${styles.banner} ${styles.bannerWarn}`}>
            <strong>Changes requested.</strong> {outstanding.reason}
          </p>
        ) : null}
        {status === 'pending_review' ? (
          <p className={`${styles.banner} ${styles.bannerWarn}`}>
            This organizer verified their mobile number and is waiting to be let into onboarding.
            Approving unlocks the onboarding steps for them.
          </p>
        ) : null}
        {status === 'approved' ? (
          <p className={`${styles.banner} ${styles.bannerGood}`}>
            Approved and visible to customers.
          </p>
        ) : null}

        {dialog ? (
          <div className={styles.dialog}>
            <p className={styles.dialogTitle}>
              {dialog === 'reject' ? 'Reject organizer' : 'Request changes'}
            </p>
            <p className={styles.dialogNote}>
              {dialog === 'reject'
                ? 'The organizer sees this reason and loses access to onboarding.'
                : 'The organizer sees this and can edit and resubmit their profile.'}
            </p>
            <textarea
              className={styles.textarea}
              placeholder="Reason (required)"
              aria-label="Reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <div className={styles.dialogActions}>
              <button type="button" className={styles.btn} onClick={() => setDialog(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btn} ${dialog === 'reject' ? styles.danger : styles.approve}`}
                disabled={reason.trim().length < 5 || busy}
                onClick={() =>
                  void run(
                    () =>
                      dialog === 'reject'
                        ? rejectOrganizer(detail.id, reason.trim())
                        : requestChanges(detail.id, reason.trim()),
                    () => setDialog(null),
                  )
                }
              >
                {busy ? 'Working…' : dialog === 'reject' ? 'Reject organizer' : 'Request changes'}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* The record itself scrolls, so the actions above never leave the screen. */}
      <div className={styles.scroller}>
        <div className={styles.grid}>
          <div>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Basic information</h2>
              <div className={styles.fields}>
                <Field label="First name" value={o.firstName} />
                <Field label="Last name" value={o.lastName} />
                <Field label="Email" value={o.contactEmail} />
                <Field label="Mobile" value={formatMobile(o.mobile)} />
                <Field label="Business name" value={o.businessName} />
                <Field label="Display name" value={o.displayName} />
                <Field label="Business type" value={o.businessType} />
                <Field label="Primary category" value={o.primaryCategory} />
                <Field label="City" value={o.city} />
                <Field label="Account roles" value={listOf(detail.accountRoles)} />
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Verification</h2>
              <div className={styles.fields}>
                <Field label="Aadhaar number" value={o.aadhaarNumber} />
                <Field label="PAN number" value={o.panNumber} />
                <Field label="GST number" value={o.gstNumber} />
                <Field label="Business reg. number" value={o.businessRegNumber} />
                <Field label="Government ID type" value={o.governmentIdType} />
              </div>
              <Docs
                files={[
                  { label: 'Government ID', file: o.governmentIdFile },
                  { label: 'PAN', file: o.panFile },
                  { label: 'GST', file: o.gstFile },
                  { label: 'Business registration', file: o.businessRegFile },
                ]}
              />
              <p className={styles.lockNote}>
                Identity fields are organizer-entered only. The API rejects admin writes here — an
                admin typing someone else&apos;s identity details would defeat the point of
                verification.
              </p>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Bank details</h2>
              <div className={styles.fields}>
                <Field label="Account holder" value={o.accountHolderName} />
                <Field label="Bank" value={o.bankName} />
                <Field label="Branch" value={o.branchName} />
                <Field label="Account number" value={o.accountNumber} />
                <Field label="IFSC" value={o.ifsc} />
                <Field label="UPI ID" value={o.upiId} />
              </div>
              <Docs files={[{ label: 'Cancelled cheque', file: o.cancelledChequeFile }]} />
              <p className={styles.lockNote}>
                Payout details are organizer-entered only, for the same reason.
              </p>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Services</h2>
              <div className={styles.fields}>
                <Field label="Experience" value={o.experience} />
                <Field label="Team size" value={o.teamSize} />
                <Field label="Languages" value={listOf(o.languages)} />
                <Field label="Occasions covered" value={listOf(o.occasions)} />
                <Field label="Services offered" value={listOf(o.servicesOffered)} />
                <Field label="Travel" value={o.travelOption} />
                <Field label="Working days" value={listOf(o.workingDays)} />
                <Field
                  label="Working hours"
                  value={
                    o.workingHoursStart && o.workingHoursEnd
                      ? `${o.workingHoursStart} – ${o.workingHoursEnd}`
                      : ''
                  }
                />
                <Field label="Minimum budget" value={money(o.minBudget)} />
                <Field label="Maximum budget" value={money(o.maxBudget)} />
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Profile &amp; portfolio</h2>
              <div className={styles.fields}>
                <Field label="Tagline" value={o.tagline} wide />
                <Field label="Business description" value={o.businessDescription} wide />
                <Field label="Website" value={o.website} />
                <Field label="Instagram" value={o.instagram} />
                <Field label="Facebook" value={o.facebook} />
                <Field label="YouTube" value={o.youtube} />
              </div>
              <Docs
                files={[
                  { label: 'Cover photo', file: o.coverPhoto },
                  { label: 'Profile photo', file: o.profilePhoto },
                ]}
              />
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Fill in missing details</h2>
              <p className={styles.cardNote}>
                Saved against the organizer&apos;s own record and attributed to you in the review
                trail. Only fields you change are sent — nothing the organizer entered is cleared.
              </p>

              {!detail.canAdminEdit ? (
                <p className={styles.lockNote}>
                  An organizer that is {STATUS_LABEL[status].toLowerCase()} cannot be edited.
                </p>
              ) : (
                <>
                  <div className={styles.editGrid}>
                    {ADMIN_EDITABLE.map((spec) => {
                      const current = String(
                        (o as unknown as Record<string, unknown>)[spec.key] ?? '',
                      );
                      const value = edits[spec.key] ?? current;
                      const dirty = value !== current;
                      return (
                        <label
                          key={spec.key}
                          className={`${styles.editField} ${spec.kind === 'textarea' ? styles.wide : ''}`}
                        >
                          <span className={styles.editLabel}>{spec.label}</span>
                          <input
                            className={`${styles.input} ${dirty ? styles.dirty : ''}`}
                            type={spec.kind === 'number' ? 'number' : 'text'}
                            value={value}
                            onChange={(event) =>
                              setEdits((prev) => ({
                                ...prev,
                                [spec.key]: event.target.value,
                              }))
                            }
                          />
                        </label>
                      );
                    })}
                  </div>
                  <div className={styles.editFoot}>
                    <span>
                      {dirtyKeys.length === 0
                        ? (editNote ?? 'No changes yet.')
                        : `${dirtyKeys.length} field${dirtyKeys.length === 1 ? '' : 's'} changed.`}
                    </span>
                    <span className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btn}
                        disabled={dirtyKeys.length === 0 || busy}
                        onClick={() => setEdits({})}
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.approve}`}
                        disabled={dirtyKeys.length === 0 || busy}
                        onClick={submitEdits}
                      >
                        {busy ? 'Saving…' : 'Save changes'}
                      </button>
                    </span>
                  </div>
                </>
              )}
            </section>
          </div>

          <div className={styles.rail}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Onboarding</h2>
              <p className={styles.cardNote}>The organizer&apos;s own step completion.</p>
              <div style={{ marginTop: 12 }}>
                <Meter percent={o.profileCompletion} />
              </div>
              <ul className={styles.steps}>
                {detail.steps.map((step) => (
                  <li key={step.id} className={styles.step}>
                    <span className={`${styles.tick} ${step.complete ? styles.tickOn : ''}`}>
                      {step.complete ? '✓' : ''}
                    </span>
                    <span>
                      {step.title}
                      {!step.complete && step.missingFields.length > 0 ? (
                        <span className={styles.stepMissing}>
                          <br />
                          Missing: {step.missingFields.join(', ')}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Review history</h2>
              <p className={styles.cardNote}>Every lifecycle action, and who took it.</p>
              <ul className={styles.trail}>
                {detail.reviewTrail.length === 0 ? (
                  <li className={styles.trailMeta}>Nothing recorded yet.</li>
                ) : (
                  detail.reviewTrail.map((entry, index) => (
                    <li key={`${entry.at}-${index}`} className={styles.trailItem}>
                      <p className={styles.trailHead}>
                        {ACTION_LABEL[entry.action] ?? entry.action}
                      </p>
                      <p className={styles.trailMeta}>
                        {entry.actorName || entry.actorRole} · {entry.actorRole} ·{' '}
                        {formatDate(entry.at)}
                      </p>
                      {entry.reason ? <p className={styles.trailReason}>{entry.reason}</p> : null}
                      {entry.fields.length > 0 ? (
                        <p className={styles.trailReason}>Fields: {entry.fields.join(', ')}</p>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
