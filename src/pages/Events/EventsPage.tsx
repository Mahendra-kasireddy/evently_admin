import { Link } from 'react-router-dom';
import { useAdminList } from '../../features/shared/useAdminList';
import {
  ListBody, ListControls, ListError, ListHead, Pager, Pill, type ChipDef,
} from '../../features/shared/ListChrome';
import { eventCounts, listEvents } from '../../features/events/service';
import {
  EVENT_STATUSES, EVENT_STATUS_LABEL, EVENT_STATUS_TONE, type EventRow,
} from '../../features/events/types';
import { formatDate, orNotProvided } from '../../features/organizers/format';
import styles from '../../features/organizers/organizers.module.css';

const CHIPS: ChipDef[] = EVENT_STATUSES.map((s) => ({
  param: 'status',
  value: s,
  label: EVENT_STATUS_LABEL[s],
}));

/**
 * The planning pipeline — what customers are trying to organise, before
 * anything is booked. Confirmed bookings are the Bookings section; an event
 * that became one links across to it from its detail page.
 */
export function EventsPage() {
  const list = useAdminList<EventRow>({
    filters: ['status'],
    fetchPage: listEvents,
    fetchCounts: eventCounts,
  });

  return (
    <div>
      <ListHead
        eyebrow="Events"
        title="Planning pipeline"
        subtitle="Every event a customer has asked organizers to quote for, and how far it has got."
      />
      <ListControls
        searchPlaceholder="Search occasion, venue or customer"
        draft={list.draft}
        onSearchChange={list.onSearchChange}
        chips={CHIPS}
        counts={list.counts}
        activeParams={{ status: list.param('status') }}
        setParam={list.setParam}
      />
      <ListError error={list.error} />
      <ListBody
        loading={list.loading}
        isEmpty={list.rows.length === 0}
        loadingLabel="Loading events…"
        emptyTitle="No events found."
        emptyHint={
          list.search || list.param('status')
            ? 'Try a different search or status filter.'
            : 'Events appear here as soon as a customer requests quotes in the app.'
        }
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Occasion</th>
              <th>Customer</th>
              <th>When</th>
              <th>Quotes</th>
              <th>Requested</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {list.rows.map((row) => (
              <tr key={row.id}>
                <td className={styles.primaryCell}>
                  {orNotProvided(row.occasion)}
                  {row.where ? <div className={styles.mutedCell}>{row.where}</div> : null}
                </td>
                <td>
                  {row.customer?.name || 'Unknown'}
                  {row.customer?.phone ? (
                    <div className={styles.mutedCell}>+91 {row.customer.phone}</div>
                  ) : null}
                </td>
                <td>{row.when || '—'}</td>
                <td className={styles.mono}>{row.quoteCount}</td>
                <td className={styles.mono}>{formatDate(row.createdAt)}</td>
                <td>
                  <Pill label={row.statusLabel} tone={EVENT_STATUS_TONE[row.status] ?? 'work'} />
                </td>
                <td>
                  <Link className={styles.linkBtn} to={`/events/${row.id}`}>View</Link>
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
