import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { authService } from '@/services/authService';
import { ROUTES } from '@/utils/constants';

type Status = 'verifying' | 'success' | 'error';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<Status>('verifying');
  const [resendEmail, setResendEmail] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    let cancelled = false;
    authService
      .verifyEmail({ token })
      .then(() => {
        if (!cancelled) setStatus('success');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleResend() {
    if (!resendEmail) return;
    setIsResending(true);
    try {
      await authService.resendVerification({ email: resendEmail });
      setResendSent(true);
    } finally {
      setIsResending(false);
    }
  }

  if (status === 'verifying') {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-xl font-semibold">Verifying your email…</h1>
        <p className="text-sm text-ink/60">This will only take a moment.</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-xl font-semibold">Email verified</h1>
        <p className="mb-4 text-sm text-ink/60">Your email address has been verified successfully.</p>
        <Link to={ROUTES.LOGIN} className="font-medium text-accent hover:underline">
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-center">
      <h1 className="text-xl font-semibold">Verification link invalid</h1>
      <p className="text-sm text-ink/60">
        This verification link is invalid or has expired. Enter your email to get a new one.
      </p>

      {resendSent ? (
        <p className="text-sm text-ink/60">
          If an account exists for {resendEmail}, a new verification link has been sent.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <input
            type="email"
            value={resendEmail}
            onChange={(event) => setResendEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-10 w-full rounded-xl border border-border bg-white px-3 text-sm text-ink placeholder:text-ink/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <Button onClick={handleResend} isLoading={isResending} disabled={!resendEmail}>
            Resend verification email
          </Button>
        </div>
      )}

      <Link to={ROUTES.LOGIN} className="text-sm font-medium text-accent hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}