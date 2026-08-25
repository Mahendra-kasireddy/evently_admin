import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullPageMessage } from '../components/FullPageMessage';
import { useAuth } from '../features/auth';

/**
 * Gate for everything behind the console.
 *
 * There is no third branch for "signed in but not an admin": AuthProvider signs
 * that user out at the moment the profile comes back, so by the time routing
 * runs they are `anonymous` and land on /login with the denial message. That
 * ordering matters — it means a non-admin never holds a live session while a
 * component decides what to do with them.
 */
export function RequireAdmin() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'restoring') {
    return <FullPageMessage title="Checking your session…" spinner />;
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
