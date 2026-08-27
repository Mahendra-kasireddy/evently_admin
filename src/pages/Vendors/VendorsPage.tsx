import { Link } from 'react-router-dom';
import { useAdminList } from '../../features/shared/useAdminList';
import {
  ListBody, ListControls, ListError, ListHead, Pager, Pill, type ChipDef,
} from '../../features/shared/ListChrome';
import { listVendors, vendorCounts } from '../../features/vendors/service';
import { CATEGORY_LABEL, VENDOR_CATEGORIES, type VendorRow } from '../../features/vendors/types';
import { formatDate, orNotProvided } from '../../features/organizers/format';
import { formatINR } from '../../lib/format';
import styles from '../../features/organizers/organizers.module.css';

const CHIPS: ChipDef[] = [
  { param: 'active', value: 'true', label: 'On roster', countKey: 'active' },
  { param: 'active', value: 'false', label: 'Off roster', countKey: 'inactive' },
  ...VENDOR_CATEGORIES.map((c) => ({ param: 'category', value: c, label: CATEGORY_LABEL[c] })),
];

/** The sub-vendor roster — the people organizers assign work to. */
export function VendorsPage() {
  const list = useAdminList<VendorRow>({
    filters: ['category', 'active'],
    fetchPage: listVendors,
    fetchCounts: vendorCounts,
  });

  return (
    <div>
      <ListHead
        eyebrow="Vendors"
        title="Sub-vendor roster"
        subtitle="Caterers, decorators, photographers and the rest — the people organizers assign work to."
      />
      <ListControls
        searchPlaceholder="Search name or service area"
        draft={list.draft}
        onSearchChange={list.onSearchChange}
        chips={CHIPS}
        counts={list.counts}
        activeParams={{ category: list.param('category'), active: list.param('active') }}
        setParam={list.setParam}
      />
      <ListError error={list.error} />
      <ListBody
        loading={list.loading}
        isEmpty={list.rows.length === 0}
        loadingLabel="Loading vendors…"
        emptyTitle="No vendors found."
        emptyHint={
          list.search || list.param('category') || list.param('active')
            ? 'Try a different search or filter.'
            : 'Vendors appear here once they complete sub-vendor onboarding in the app.'
        }
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Category</th>
              <th>Base rate</th>
              <th>Organizers</th>
              <th>Joined</th>
              <th>Roster</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {list.rows.map((row) => (
              <tr key={row.id}>
                <td className={styles.primaryCell}>
                  {orNotProvided(row.fullName)}
                  {row.serviceArea ? <div className={styles.mutedCell}>{row.serviceArea}</div> : null}
                </td>
                <td>{row.categoryLabel}</td>
                <td className={styles.mono}>
                  {row.baseRate > 0
                    ? `${formatINR(row.baseRate)}${row.baseRateUnit ? ` / ${row.baseRateUnit}` : ''}`
                    : '—'}
                </td>
                <td className={styles.mono}>{row.organizerCount}</td>
                <td className={styles.mono}>{formatDate(row.createdAt)}</td>
                <td>
                  <Pill label={row.active ? 'On roster' : 'Off roster'} tone={row.active ? 'good' : 'bad'} />
                </td>
                <td>
                  <Link className={styles.linkBtn} to={`/vendors/${row.id}`}>
                    View
                  </Link>
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
