import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services/authService';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES } from '@/utils/constants';

export function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await authService.forgotPassword({ email });
      setIsSent(true);
    } catch {
      showToast({ title: 'Something went wrong', description: 'Please try again.', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-xl font-semibold">Check your inbox</h1>
        <p className="text-sm text-ink/60">
          If an account exists for {email}, we've sent a link to reset your password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-center text-xl font-semibold">Reset your password</h1>
      <p className="text-center text-sm text-ink/60">
        Enter your email and we'll send you a link to reset it.
      </p>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Send reset link
      </Button>
      <p className="text-center text-sm text-ink/60">
        <Link to={ROUTES.LOGIN} className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
