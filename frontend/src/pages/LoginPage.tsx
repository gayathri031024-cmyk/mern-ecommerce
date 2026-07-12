import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';

export function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await login({ email, password });
      const redirectTo = (location.state as { from?: Location })?.from?.pathname ?? ROUTES.HOME;
      navigate(redirectTo, { replace: true });
    } catch {
      setError('Invalid email or password.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-center text-xl font-semibold">Sign in to your account</h1>
      <Input
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end">
        <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm text-accent hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" isLoading={isLoggingIn} className="w-full">
        Sign in
      </Button>
      <p className="text-center text-sm text-ink/60">
        Don't have an account?{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-accent hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
