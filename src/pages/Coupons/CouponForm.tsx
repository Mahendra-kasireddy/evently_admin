import { useState } from 'react';
import type { Coupon, CouponTerms } from '../../features/coupons/types';
import styles from '../Organizers/detail.module.css';

/**
 * The terms of a coupon, as a form.
 *
 * Shared by the create dialog and the edit panel so the two can never drift
 * into disagreeing about what a coupon is. `existing` decides which mode it is
 * in: creating asks for a code, editing does not, because customers have
 * already been given the old one and the ledger records redemptions by it.
 *
 * Nothing here validates the discount for real — the server does that, and
 * doing it twice is how the two answers start to differ. What this does is
 * stop the obviously incomplete form from being submitted at all, so the
 * round trip is spent on things worth an error message.
 */
export function CouponForm({
  existing,
  busy,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  existing?: Coupon;
  busy: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (terms: CouponTerms) => void;
}) {
  const [code, setCode] = useState(existing?.code ?? '');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [discountType, setDiscountType] = useState(existing?.discountType ?? 'percentage');
  const [discountValue, setDiscountValue] = useState(String(existing?.discountValue ?? ''));
  const [maxDiscount, setMaxDiscount] = useState(String(existing?.maxDiscount ?? 0));
  const [minBookingAmount, setMinBooking] = useState(String(existing?.minBookingAmount ?? 0));
  const [startsAt, setStartsAt] = useState(toDateInput(existing?.startsAt));
  const [endsAt, setEndsAt] = useState(toDateInput(existing?.endsAt));
  const [usageLimit, setUsageLimit] = useState(String(existing?.usageLimit ?? 0));
  const [perCustomerLimit, setPerCustomer] = useState(String(existing?.perCustomerLimit ?? 1));

  const creating = !existing;
  const value = Number(discountValue);
  const ready =
    (!creating || code.trim().length >= 4) && title.trim().length >= 3 && value >= 1 && !busy;

  return (
    <div className={styles.dialog}>
      <p className={styles.dialogTitle}>{creating ? 'New platform coupon' : 'Edit coupon'}</p>
      <p className={styles.dialogNote}>
        {creating
          ? 'Platform coupons apply to any booking. Customers type the code at checkout.'
          : 'The code cannot be changed — customers already have it, and redemptions record it.'}
      </p>

      <div className={styles.editGrid}>
        {creating ? (
          <Field label="Code">
            <input
              className={styles.input}
              value={code}
              placeholder="DIWALI20"
              maxLength={20}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
          </Field>
        ) : null}

        <Field label="Title">
          <input
            className={styles.input}
            value={title}
            placeholder="20% off your Diwali booking"
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>

        <Field label="Description">
          <input
            className={styles.input}
            value={description}
            placeholder="Shown to the customer under the code"
            maxLength={300}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <Field label="Discount type">
          <select
            className={styles.input}
            value={discountType}
            onChange={(event) => setDiscountType(event.target.value as 'percentage' | 'fixed')}
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </Field>

        <Field label={discountType === 'percentage' ? 'Percent off' : 'Rupees off'}>
          <input
            className={styles.input}
            type="number"
            min={1}
            value={discountValue}
            onChange={(event) => setDiscountValue(event.target.value)}
          />
        </Field>

        {/* Only a percentage can run away with a large booking. */}
        {discountType === 'percentage' ? (
          <Field label="Maximum discount (₹, 0 = uncapped)">
            <input
              className={styles.input}
              type="number"
              min={0}
              value={maxDiscount}
              onChange={(event) => setMaxDiscount(event.target.value)}
            />
          </Field>
        ) : null}

        <Field label="Minimum booking (₹, 0 = none)">
          <input
            className={styles.input}
            type="number"
            min={0}
            value={minBookingAmount}
            onChange={(event) => setMinBooking(event.target.value)}
          />
        </Field>

        <Field label="Starts (blank = now)">
          <input
            className={styles.input}
            type="date"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
        </Field>

        <Field label="Ends (blank = no end)">
          <input
            className={styles.input}
            type="date"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
        </Field>

        <Field label="Total uses (0 = unlimited)">
          <input
            className={styles.input}
            type="number"
            min={0}
            value={usageLimit}
            onChange={(event) => setUsageLimit(event.target.value)}
          />
        </Field>

        <Field label="Uses per customer (0 = unlimited)">
          <input
            className={styles.input}
            type="number"
            min={0}
            value={perCustomerLimit}
            onChange={(event) => setPerCustomer(event.target.value)}
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
          disabled={!ready}
          onClick={() =>
            onSubmit({
              code: code.trim().toUpperCase(),
              title: title.trim(),
              description: description.trim(),
              discountType,
              discountValue: value,
              // A cap on a fixed discount means nothing, so it is never sent.
              maxDiscount: discountType === 'percentage' ? numberOr(maxDiscount, 0) : 0,
              minBookingAmount: numberOr(minBookingAmount, 0),
              startsAt: startsAt ? new Date(startsAt).toISOString() : null,
              endsAt: endsAt ? endOfDay(endsAt) : null,
              usageLimit: numberOr(usageLimit, 0),
              perCustomerLimit: numberOr(perCustomerLimit, 1),
            })
          }
        >
          {busy ? 'Working…' : submitLabel}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={styles.editField}>
      <span className={styles.editLabel}>{label}</span>
      {children}
    </label>
  );
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

/**
 * An end date means the end of that day.
 *
 * Picking the 31st and having the coupon die at midnight on the 30th is the
 * kind of off-by-one a customer experiences as the offer simply not working.
 */
function endOfDay(value: string): string {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

function numberOr(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}
