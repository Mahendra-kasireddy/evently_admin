import { Navigate, Outlet } from 'react-router-dom';
import { FullPageMessage } from '../components/FullPageMessage';
import { useAuth } from '../features/auth';

/** Keeps a signed-in admin from landing back on the login screens. */
export function AnonymousOnly() {
  const { status } = useAuth();

  if (status === 'restoring') {
    return <FullPageMessage title="Checking your session…" spinner />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
