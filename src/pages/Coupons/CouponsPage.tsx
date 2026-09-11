import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminList } from '../../features/shared/useAdminList';
import {
  ListBody,
  ListControls,
  ListError,
  ListHead,
  Pager,
  Pill,
  type ChipDef,
} from '../../features/shared/ListChrome';
import { couponCounts, createCoupon, listCoupons } from '../../features/coupons/service';
import {
  SCOPE_LABEL,
  discountLabel,
  usageLabel,
  type Coupon,
  type CouponTerms,
} from '../../features/coupons/types';
import { errorMessage } from '../../lib/api/errors';
import { formatDate } from '../../features/organizers/format';
import { CouponForm } from './CouponForm';
import styles from '../../features/organizers/organizers.module.css';
import detail from '../Organizers/detail.module.css';

const CHIPS: ChipDef[] = [
  { param: 'status', value: 'active', label: 'Active' },
  { param: 'status', value: 'disabled', label: 'Disabled' },
  { param: 'scope', value: 'platform', label: 'Platform' },
  { param: 'scope', value: 'organizer', label: 'Organizer' },
];

/**
 * Every coupon on the marketplace — the platform's own and the organizers'.
 *
 * Admins create platform coupons here. Organizer coupons are listed but not
 * created here: an organizer discounting their own work does not need asking,
 * because they already set their own quotation totals with no review. What an
 * admin can do to one is switch it off, which is the lever that matters when a
 * coupon is being abused.
 */
export function CouponsPage() {
  const navigate = useNavigate();
  const list = useAdminList<Coupon>({
    filters: ['scope', 'status'],
    fetchPage: listCoupons,
    fetchCounts: couponCounts,
  });

  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function submit(terms: CouponTerms) {
    if (busy) return;
    setBusy(true);
    setCreateError(null);
    try {
      const created = await createCoupon(terms);
      setCreating(false);
      // Straight to the new coupon: the next thing anybody does is check it.
      navigate(`/coupons/${created.id}`);
    } catch (cause: unknown) {
      setCreateError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <ListHead
        eyebrow="Coupons"
        title="Coupons"
        subtitle="Platform coupons you issue, and every coupon organizers have issued for their own work."
      />

      <div className={detail.actions}>
        <button
          type="button"
          className={`${detail.btn} ${detail.approve}`}
          onClick={() => {
            setCreateError(null);
            setCreating((open) => !open);
          }}
        >
          {creating ? 'Close' : 'New platform coupon'}
        </button>
      </div>

      {creating ? (
        <>
          {createError ? (
            <p className={`${detail.banner} ${detail.bannerBad}`} role="alert">
              {createError}
            </p>
          ) : null}
          <CouponForm
            busy={busy}
            submitLabel="Create coupon"
            onCancel={() => setCreating(false)}
            onSubmit={(terms) => void submit(terms)}
          />
        </>
      ) : null}

      <ListControls
        searchPlaceholder="Search code or title"
        draft={list.draft}
        onSearchChange={list.onSearchChange}
        chips={CHIPS}
        counts={list.counts}
        activeParams={{ scope: list.param('scope'), status: list.param('status') }}
        setParam={list.setParam}
      />
      <ListError error={list.error} />
      <ListBody
        loading={list.loading}
        isEmpty={list.rows.length === 0}
        loadingLabel="Loading coupons…"
        emptyTitle="No coupons found."
        emptyHint={
          list.search || list.param('scope') || list.param('status')
            ? 'Try a different search or filter.'
            : 'Create a platform coupon, or wait for an organizer to issue one of their own.'
        }
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Owner</th>
              <th>Used</th>
              <th>Ends</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {list.rows.map((row) => (
              <tr key={row.id}>
                <td className={styles.primaryCell}>
                  {row.code}
                  <div className={styles.mutedCell}>{row.title}</div>
                </td>
                <td>{discountLabel(row)}</td>
                <td>
                  {SCOPE_LABEL[row.scope]}
                  {row.organizerName ? (
                    <div className={styles.mutedCell}>{row.organizerName}</div>
                  ) : null}
                </td>
                <td className={styles.mono}>{usageLabel(row)}</td>
                <td className={styles.mono}>{row.endsAt ? formatDate(row.endsAt) : 'No end'}</td>
                <td>
                  <Pill
                    label={row.status === 'active' ? 'Active' : 'Disabled'}
                    tone={row.status === 'active' ? 'good' : 'bad'}
                  />
                </td>
                <td>
                  <Link className={styles.linkBtn} to={`/coupons/${row.id}`}>
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

export default CouponsPage;
