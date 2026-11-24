import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isApiConfigured } from '../../lib/api/client';
import { errorMessage } from '../../lib/api/errors';
import { MOBILE_PATTERN, useAuth } from '../../features/auth';
import { LoginShell } from './LoginShell';
import styles from './login.module.css';
import type { OtpHandoff } from './handoff';

/**
 * Sign-up for someone an admin has invited. Invite-only: the API sends a code
 * only to a number with a pending invite, so an uninvited number is told so
 * here, before any SMS. Verifying the code is what makes the account an admin;
 * the name comes from the invite.
 */
export function SignupStep() {
  const { requestOtp } = useAuth();
  const navigate = useNavigate();
  const configured = isApiConfigured();

  const [mobile, setMobile] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const valid = MOBILE_PATTERN.test(mobile);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!valid) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const challenge = await requestOtp(mobile, 'signup');
      const handoff: OtpHandoff = {
        requestId: challenge.requestId,
        mobile,
        sentTo: challenge.sentTo,
        mode: 'signup',
      };
      navigate('/verify-otp', { state: handoff });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <LoginShell>
      <p className={styles.eyebrow}>Sign up</p>
      <h2 className={styles.title}>Join Evently Admin</h2>
      <p className={styles.subtitle}>
        Enter the mobile number an admin invited. We’ll send a code to confirm it’s you.
      </p>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {!configured ? (
          <p className={styles.banner} role="alert">
            This console isn’t configured yet — <code>VITE_API_BASE_URL</code> is empty. Set it and
            reload.
          </p>
        ) : null}

        <div>
          <label className={styles.label} htmlFor="signup-mobile">
            Invited mobile number
          </label>
          <div className={`${styles.inputRow} ${error ? styles.invalid : ''}`}>
            <span className={styles.prefix}>+91</span>
            <input
              id="signup-mobile"
              className={styles.input}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              placeholder="10-digit number"
              value={mobile}
              disabled={busy}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setMobile(event.target.value.replace(/\D/g, '').slice(0, 10));
                setError(null);
              }}
            />
          </div>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <button className={styles.submit} type="submit" disabled={busy || !configured}>
          {busy ? 'Checking invite…' : 'Send OTP'}
        </button>

        <p className={styles.hint}>
          Only numbers invited from the Team page can sign up.
        </p>

        <p className={styles.switch}>
          Already an admin?{' '}
          <Link className={styles.switchLink} to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </LoginShell>
  );
}
