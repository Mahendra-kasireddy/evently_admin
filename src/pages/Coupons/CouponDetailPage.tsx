import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { errorMessage } from '../../lib/api/errors';
import {
  getCoupon,
  getCouponUsage,
  setCouponStatus,
  updateCoupon,
} from '../../features/coupons/service';
import {
  SCOPE_LABEL,
  discountLabel,
  usageLabel,
  type Coupon,
  type CouponTerms,
  type Redemption,
} from '../../features/coupons/types';
import { Pill } from '../../features/shared/ListChrome';
import { formatDate } from '../../features/organizers/format';
import { formatINR } from '../../lib/format';
import { FullPageMessage } from '../../components/FullPageMessage';
import { CouponForm } from './CouponForm';
import styles from '../Organizers/detail.module.css';
import list from '../../features/organizers/organizers.module.css';

/** The terms an edit may change — everything except the code. */
function stripCode(terms: CouponTerms): Omit<CouponTerms, 'code'> {
  const { code, ...rest } = terms;
  void code;
  return rest;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <p className={styles.fieldLabel}>{label}</p>
      <p className={styles.fieldValue}>{value}</p>
    </div>
  );
}

/**
 * One coupon: its terms, and who has actually spent it.
 *
 * The usage table is read from the redemption ledger, not from the counter on
 * the coupon. The counter exists so the usage limit can be claimed in one
 * atomic write; it is not the record of what happened, and a screen that read
 * it would be able to say "12 used" while showing eleven rows.
 */
export function CouponDetailPage() {
  const { id = '' } = useParams();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [usage, setUsage] = useState<Redemption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getCoupon(id, controller.signal), getCouponUsage(id, controller.signal)])
      .then(([found, rows]) => {
        if (controller.signal.aborted) return;
        setCoupon(found);
        setUsage(rows);
        setLoadError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(errorMessage(cause));
      });
    return () => controller.abort();
  }, [id]);

  async function run(action: () => Promise<Coupon>, after?: () => void) {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      setCoupon(await action());
      after?.();
    } catch (cause: unknown) {
      setActionError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div>
        <Link className={styles.back} to="/coupons">
          ← Coupons
        </Link>
        <p className={list.error} role="alert">
          {loadError}
        </p>
      </div>
    );
  }

  if (!coupon) return <FullPageMessage title="Loading coupon…" spinner />;

  const active = coupon.status === 'active';
  const redeemed = usage.filter((row) => row.status === 'redeemed');
  const saved = redeemed.reduce((sum, row) => sum + row.discountAmount, 0);

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <Link className={styles.back} to="/coupons">
          ← Coupons
        </Link>
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.name}>{coupon.code}</h1>
          <div className={styles.metaRow}>
            <span>{coupon.title}</span>
            <span className={styles.dot} />
            <span>{SCOPE_LABEL[coupon.scope]}</span>
            {coupon.organizerName ? (
              <>
                <span className={styles.dot} />
                <span>{coupon.organizerName}</span>
              </>
            ) : null}
          </div>
        </div>
        <Pill label={active ? 'Active' : 'Disabled'} tone={active ? 'good' : 'bad'} />
      </div>

      {actionError ? (
        <p className={`${styles.banner} ${styles.bannerBad}`} role="alert">
          {actionError}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.btn} ${active ? styles.danger : styles.approve}`}
          disabled={busy}
          onClick={() => void run(() => setCouponStatus(coupon.id, active ? 'disabled' : 'active'))}
        >
          {busy ? 'Working…' : active ? 'Disable coupon' : 'Enable coupon'}
        </button>
        <button
          type="button"
          className={styles.btn}
          disabled={busy}
          onClick={() => setEditing((open) => !open)}
        >
          {editing ? 'Close' : 'Edit terms'}
        </button>
      </div>

      {/* Disabling takes it out of every customer's picker immediately; the
          redemptions it already has are untouched. */}
      {editing ? (
        <CouponForm
          existing={coupon}
          busy={busy}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={(terms: CouponTerms) =>
            void run(
              // The code is dropped rather than sent and ignored: the update
              // endpoint does not accept one, and a request carrying a field
              // the server strips reads like it did something.
              () => updateCoupon(coupon.id, stripCode(terms)),
              () => setEditing(false),
            )
          }
        />
      ) : null}

      <div className={styles.card}>
        <p className={styles.cardTitle}>Terms</p>
        <div className={styles.fields}>
          <Field label="Discount" value={discountLabel(coupon)} />
          <Field
            label="Minimum booking"
            value={coupon.minBookingAmount > 0 ? formatINR(coupon.minBookingAmount) : 'None'}
          />
          <Field label="Starts" value={coupon.startsAt ? formatDate(coupon.startsAt) : 'Immediately'} />
          <Field label="Ends" value={coupon.endsAt ? formatDate(coupon.endsAt) : 'No end date'} />
          <Field label="Total uses" value={usageLabel(coupon)} />
          <Field
            label="Per customer"
            value={coupon.perCustomerLimit > 0 ? String(coupon.perCustomerLimit) : 'Unlimited'}
          />
          <Field label="Created by" value={coupon.createdByRole} />
          <Field label="Created" value={coupon.createdAt ? formatDate(coupon.createdAt) : '—'} />
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.cardTitle}>Usage</p>
        <p className={styles.cardNote}>
          {redeemed.length === 0
            ? 'Nobody has used this coupon yet.'
            : `${redeemed.length} redemption${redeemed.length === 1 ? '' : 's'}, ${formatINR(saved)} discounted.`}
        </p>
        {usage.length > 0 ? (
          <table className={list.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Booking</th>
                <th>Organizer</th>
                <th>Before</th>
                <th>Discount</th>
                <th>Charged</th>
                <th>When</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {usage.map((row) => (
                <tr key={row.id}>
                  <td className={list.primaryCell}>{row.customerName}</td>
                  <td className={list.mono}>{row.bookingRef || '—'}</td>
                  <td>{row.organizerName || '—'}</td>
                  <td className={list.mono}>{formatINR(row.originalAmount)}</td>
                  <td className={list.mono}>−{formatINR(row.discountAmount)}</td>
                  <td className={list.mono}>{formatINR(row.finalAmount)}</td>
                  <td className={list.mono}>{row.redeemedAt ? formatDate(row.redeemedAt) : '—'}</td>
                  <td>
                    {/* A reversal is a booking that never happened — the slot
                        went back to the customer, so it is not a use. */}
                    <Pill
                      label={row.status === 'redeemed' ? 'Redeemed' : 'Returned'}
                      tone={row.status === 'redeemed' ? 'good' : 'wait'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}

export default CouponDetailPage;
