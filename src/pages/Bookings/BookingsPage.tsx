import { Link } from 'react-router-dom';
import { useAdminList } from '../../features/shared/useAdminList';
import {
  ListBody, ListControls, ListError, ListHead, Pager, Pill, type ChipDef,
} from '../../features/shared/ListChrome';
import { bookingCounts, listBookings } from '../../features/bookings/service';
import {
  BOOKING_STATUSES, BOOKING_STATUS_LABEL, BOOKING_STATUS_TONE, type BookingRow,
} from '../../features/bookings/types';
import { formatDate } from '../../features/organizers/format';
import { formatINR } from '../../lib/format';
import styles from '../../features/organizers/organizers.module.css';

const CHIPS: ChipDef[] = BOOKING_STATUSES.map((s) => ({
  param: 'status',
  value: s,
  label: BOOKING_STATUS_LABEL[s],
}));

/** Every booking in the system, whatever stage it is at. */
export function BookingsPage() {
  const list = useAdminList<BookingRow>({
    filters: ['status', 'paymentStatus'],
    fetchPage: listBookings,
    fetchCounts: bookingCounts,
  });

  return (
    <div>
      <ListHead
        eyebrow="Bookings"
        title="All bookings"
        subtitle="Confirmed events and the ones still waiting on an organizer, newest first."
      />
      <ListControls
        searchPlaceholder="Search reference, title or venue"
        draft={list.draft}
        onSearchChange={list.onSearchChange}
        chips={CHIPS}
        counts={list.counts}
        activeParams={{ status: list.param('status'), paymentStatus: list.param('paymentStatus') }}
        setParam={list.setParam}
      />
      <ListError error={list.error} />
      <ListBody
        loading={list.loading}
        isEmpty={list.rows.length === 0}
        loadingLabel="Loading bookings…"
        emptyTitle="No bookings found."
        emptyHint={
          list.search || list.param('status') || list.param('paymentStatus')
            ? 'Try a different search or status filter.'
            : 'Bookings appear here as soon as a customer accepts a quote and pays their advance.'
        }
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Customer</th>
              <th>Organizer</th>
              <th>Event date</th>
              <th>Value</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {list.rows.map((row) => (
              <tr key={row.id}>
                <td className={styles.primaryCell}>
                  {row.ref}
                  <div className={styles.mutedCell}>{row.title}</div>
                </td>
                <td>{row.customer?.name || '—'}</td>
                <td>{row.organizer?.name || '—'}</td>
                <td className={styles.mono}>{formatDate(row.eventDate)}</td>
                <td className={styles.mono}>{formatINR(row.amount)}</td>
                <td>
                  <Pill label={row.statusLabel} tone={BOOKING_STATUS_TONE[row.status] ?? 'work'} />
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
