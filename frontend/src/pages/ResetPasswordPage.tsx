import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services/authService';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES } from '@/utils/constants';
import { isStrongPassword } from '@/utils/validators';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!token) return setError('This reset link is invalid or has expired.');
    if (!isStrongPassword(password)) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setIsSubmitting(true);
    try {
      await authService.resetPassword({ token, password });
      showToast({
        title: 'Password reset',
        description: 'Please sign in with your new password.',
        variant: 'success',
      });
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      setError('This reset link is invalid or has expired. Please request a new one.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-xl font-semibold">Invalid reset link</h1>
        <p className="text-sm text-ink/60">
          This password reset link is missing or invalid.{' '}
          <Link to={ROUTES.FORGOT_PASSWORD} className="font-medium text-accent hover:underline">
            Request a new one
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-center text-xl font-semibold">Choose a new password</h1>
      <Input
        label="New password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="new-password"
        hint="At least 8 characters."
        required
      />
      <Input
        label="Confirm new password"
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        autoComplete="new-password"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Reset password
      </Button>
      <p className="text-center text-sm text-ink/60">
        <Link to={ROUTES.LOGIN} className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}