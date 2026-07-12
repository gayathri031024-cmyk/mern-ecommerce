import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';
import { isStrongPassword, isValidEmail } from '@/utils/validators';

export function RegisterPage() {
  const { register, isRegistering } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    if (!isStrongPassword(password)) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    try {
      await register({ name, email, password, confirmPassword });
      navigate(ROUTES.HOME, { replace: true });
    } catch {
      setError('Could not create your account. Try a different email.');
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <h1 className="text-center text-xl font-semibold">Create your account</h1>
      <Input
        label="Full name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
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
        autoComplete="new-password"
        hint="At least 8 characters."
        required
      />
      <Input
        label="Confirm password"
        name="confirmPassword"
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        autoComplete="new-password"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" isLoading={isRegistering} className="w-full">
        Create account
      </Button>
      <p className="text-center text-sm text-ink/60">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}