import { Navigate, Route, Routes } from 'react-router-dom';
import { FullPageMessage } from '../components/FullPageMessage';
import { AdminLayout } from '../layouts/AdminLayout';
import { DashboardPage } from '../pages/Dashboard';
import { MobileStep, OtpStep } from '../pages/Login';
import { OrganizerDetailPage, OrganizersPage } from '../pages/Organizers';
import { ContactDetailPage, ContactPage } from '../pages/Contact';
import { UserDetailPage, UsersPage } from '../pages/Users';
import { VendorDetailPage, VendorsPage } from '../pages/Vendors';
import { CouponDetailPage, CouponsPage } from '../pages/Coupons';
import { EventDetailPage, EventsPage } from '../pages/Events';
import { BookingDetailPage, BookingsPage } from '../pages/Bookings';
import { PaymentsPage } from '../pages/Payments';
import { AnonymousOnly } from './AnonymousOnly';
import { RequireAdmin } from './RequireAdmin';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AnonymousOnly />}>
        <Route path="/login" element={<MobileStep />} />
        <Route path="/verify-otp" element={<OtpStep />} />
      </Route>

      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/organizers" element={<OrganizersPage />} />
          <Route path="/organizers/:id" element={<OrganizerDetailPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
          <Route path="/coupons/:id" element={<CouponDetailPage />} />
          <Route path="/vendors/:id" element={<VendorDetailPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/contact-us" element={<ContactPage />} />
          <Route path="/contact-us/:id" element={<ContactDetailPage />} />
        </Route>
      </Route>

      {/* The console has one home. RequireAdmin decides who reaches it. */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="*"
        element={<FullPageMessage title="Page not found" detail="That URL isn’t part of the admin console." />}
      />
    </Routes>
  );
}
