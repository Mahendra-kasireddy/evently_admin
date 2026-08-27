import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PAGE_SIZE, useAdminList } from '../../features/shared/useAdminList';
import {
  ListBody, ListControls, ListError, ListHead, Pager, Pill, type ChipDef,
} from '../../features/shared/ListChrome';
import { listPayments, paymentCounts, paymentTotals } from '../../features/bookings/service';
import {
  PAYMENT_STATUSES, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE,
  type BookingRow, type PaymentTotals,
} from '../../features/bookings/types';
import { formatDate } from '../../features/organizers/format';
import { formatINR } from '../../lib/format';
import styles from '../../features/organizers/organizers.module.css';
import money from './payments.module.css';

const CHIPS: ChipDef[] = PAYMENT_STATUSES.map((s) => ({
  param: 'paymentStatus',
  value: s,
  label: PAYMENT_STATUS_LABEL[s],
}));

/**
 * Booking finance.
 *
 * NOT a payment ledger, and the page says so: Evently records no transactions
 * and has no gateway wired, so every figure here is summed from booking
 * documents. "Collected" is what bookings state was paid — not a settlement a
 * payment provider confirmed.
 */
export function PaymentsPage() {
  const list = useAdminList<BookingRow>({
    filters: ['paymentStatus'],
    fetchPage: listPayments,
    fetchCounts: paymentCounts,
  });

  const [totals, setTotals] = useState<PaymentTotals | null>(null);
  const paymentStatus = list.param('paymentStatus');

  useEffect(() => {
    const controller = new AbortController();
    paymentTotals(
      {
        search: list.search,
        page: 1,
        limit: PAGE_SIZE,
        filters: paymentStatus ? { paymentStatus } : {},
      },
      controller.signal,
    )
      .then((t) => {
        if (!controller.signal.aborted) setTotals(t);
      })
      .catch(() => {
        // The table's own error line already reports a failed load; a second
        // message for the totals strip would just be noise.
        if (!controller.signal.aborted) setTotals(null);
      });
    return () => controller.abort();
  }, [list.search, paymentStatus]);

  return (
    <div>
      <ListHead
        eyebrow="Payments"
        title="Booking finance"
        subtitle="What each booking is worth, what it records as collected, and what is still outstanding."
      />

      <div className={money.totals}>
        <div className={money.tile}>
          <p className={money.tileLabel}>Contracted value</p>
          <p className={money.tileValue}>{totals ? formatINR(totals.contractedValue) : '—'}</p>
          <p className={money.tileNote}>
            {totals ? `${totals.bookings} booking${totals.bookings === 1 ? '' : 's'}` : ' '}
          </p>
        </div>
        <div className={money.tile}>
          <p className={money.tileLabel}>Recorded as collected</p>
          <p className={`${money.tileValue} ${money.good}`}>
            {totals ? formatINR(totals.collected) : '—'}
          </p>
          <p className={money.tileNote}>Advances taken at booking time</p>
        </div>
        <div className={money.tile}>
          <p className={money.tileLabel}>Outstanding</p>
          <p className={`${money.tileValue} ${money.warn}`}>
            {totals ? formatINR(totals.outstanding) : '—'}
          </p>
          <p className={money.tileNote}>Balances due after each event</p>
        </div>
      </div>

      <p className={money.caveat}>
        These figures come from booking records. Evently stores no transactions and has no payment
        provider connected, so “collected” is what a booking states was paid — not a settlement
        confirmed by a gateway.
      </p>

      <ListControls
        searchPlaceholder="Search reference, title or venue"
        draft={list.draft}
        onSearchChange={list.onSearchChange}
        chips={CHIPS}
        counts={list.counts}
        activeParams={{ paymentStatus }}
        setParam={list.setParam}
      />
      <ListError error={list.error} />
      <ListBody
        loading={list.loading}
        isEmpty={list.rows.length === 0}
        loadingLabel="Loading booking finance…"
        emptyTitle="Nothing to show."
        emptyHint={
          list.search || paymentStatus
            ? 'Try a different search or payment filter.'
            : 'Amounts appear here as soon as bookings exist.'
        }
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Advance</th>
              <th>Paid</th>
              <th>Outstanding</th>
              <th>Payment</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {list.rows.map((row) => (
              <tr key={row.id}>
                <td className={styles.primaryCell}>
                  {row.ref}
                  <div className={styles.mutedCell}>{formatDate(row.eventDate)}</div>
                </td>
                <td>{row.customer?.name || '—'}</td>
                <td className={styles.mono}>{formatINR(row.amount)}</td>
                <td className={styles.mono}>
                  {formatINR(row.advanceAmount)}
                  <div className={styles.mutedCell}>{row.advancePercentage}%</div>
                </td>
                <td className={styles.mono}>{formatINR(row.amountPaid)}</td>
                <td className={styles.mono}>{formatINR(row.outstanding)}</td>
                <td>
                  <Pill
                    label={row.paymentStatusLabel}
                    tone={PAYMENT_STATUS_TONE[row.paymentStatus] ?? 'wait'}
                  />
                </td>
                <td>
                  <Link className={styles.linkBtn} to={`/bookings/${row.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ListBody>
      <Pager
        total={list.total}
        from={list.from}
        to={list.to}
        page={list.page}
        pages={list.pages}
        setParam={list.setParam}
      />
    </div>
  );
}
