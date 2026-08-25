import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../../lib/api/errors';
import { OTP_LENGTH, useAuth } from '../../features/auth';
import { LoginShell } from './LoginShell';
import { isOtpHandoff } from './handoff';
import styles from './login.module.css';

/** Seconds before "Resend code" is offered again. The backend also rate-limits. */
const RESEND_AFTER = 30;

/** Step 2 — the 6-digit code. `VerifyOtpDto` matches /^\d{6}$/. */
export function OtpStep() {
  const { submitOtp, requestOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handoff = isOtpHandoff(location.state) ? location.state : null;

  const [requestId, setRequestId] = useState(handoff?.requestId ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_AFTER);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  // A reload loses the in-memory challenge. Start over rather than guess.
  if (!handoff) return <Navigate to="/login" replace />;

  const complete = code.length === OTP_LENGTH;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!complete) {
      setError(`Enter the ${OTP_LENGTH}-digit code`);
      return;
    }
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const outcome = await submitOtp(requestId, code);
      // A denied non-admin is already signed out; /login shows the reason.
      navigate(outcome === 'admin' ? '/dashboard' : '/login', { replace: true });
    } catch (cause) {
      setError(errorMessage(cause));
      setCode('');
      inputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    if (busy || cooldown > 0 || !handoff) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const challenge = await requestOtp(handoff.mobile);
      setRequestId(challenge.requestId);
      setCode('');
      setCooldown(RESEND_AFTER);
      setNotice('We’ve sent a new code.');
      inputRef.current?.focus();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <LoginShell>
      <p className={styles.eyebrow}>Verify</p>
      <h2 className={styles.title}>Enter your code</h2>
      <p className={styles.subtitle}>
        We sent a {OTP_LENGTH}-digit code to {handoff.sentTo || `the number ending ${handoff.mobile.slice(-4)}`}.
      </p>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div>
          <label className={styles.label} htmlFor="otp">
            Verification code
          </label>
          <div className={`${styles.inputRow} ${error ? styles.invalid : ''}`}>
            <input
              id="otp"
              ref={inputRef}
              className={`${styles.input} ${styles.otpInput}`}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_LENGTH}
              placeholder="000000"
              value={code}
              disabled={busy}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH));
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
        {notice ? (
          <p className={styles.hint} role="status">
            {notice}
          </p>
        ) : null}

        <button className={styles.submit} type="submit" disabled={busy}>
          {busy ? 'Verifying…' : 'Verify and continue'}
        </button>

        <div className={styles.actions}>
          <button
            className={styles.linkButton}
            type="button"
            onClick={() => navigate('/login', { replace: true })}
          >
            Change number
          </button>
          <button
            className={styles.linkButton}
            type="button"
            onClick={onResend}
            disabled={busy || cooldown > 0}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      </form>
    </LoginShell>
  );
}
