import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { isApiConfigured } from '../../lib/api/client';
import { errorMessage } from '../../lib/api/errors';
import { MOBILE_PATTERN, useAuth } from '../../features/auth';
import { LoginShell } from './LoginShell';
import styles from './login.module.css';
import type { OtpHandoff } from './handoff';

/** Step 1 — the phone number. `SendOtpDto` wants 10 digits and no dial code. */
export function MobileStep() {
  const { requestOtp, accessDenied } = useAuth();
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
      const challenge = await requestOtp(mobile);
      const handoff: OtpHandoff = {
        requestId: challenge.requestId,
        mobile,
        sentTo: challenge.sentTo,
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
      <p className={styles.eyebrow}>Sign in</p>
      <h2 className={styles.title}>Evently Admin</h2>
      <p className={styles.subtitle}>
        Enter your registered mobile number and we’ll send a verification code.
      </p>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {accessDenied ? (
          <p className={styles.banner} role="alert">
            {accessDenied}
          </p>
        ) : null}

        {!configured ? (
          <p className={styles.banner} role="alert">
            This console isn’t configured yet — <code>VITE_API_BASE_URL</code> is empty. Set it and
            reload.
          </p>
        ) : null}

        <div>
          <label className={styles.label} htmlFor="mobile">
            Mobile number
          </label>
          <div className={`${styles.inputRow} ${error ? styles.invalid : ''}`}>
            <span className={styles.prefix}>+91</span>
            <input
              id="mobile"
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
          {busy ? 'Sending code…' : 'Send OTP'}
        </button>
      </form>
    </LoginShell>
  );
}
