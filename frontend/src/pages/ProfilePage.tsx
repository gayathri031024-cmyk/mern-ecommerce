import { FormEvent, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { userService } from '@/services/userService';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/contexts/ToastContext';

export function ProfilePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => userService.getProfile(),
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () => userService.updateProfile({ name, phone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      showToast({ title: 'Profile updated', variant: 'success' });
    },
    onError: () => showToast({ title: 'Update failed', variant: 'error' }),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    updateMutation.mutate();
  }

  if (isLoading) return <p className="text-ink/50">Loading profile…</p>;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold">Profile settings</h1>
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} required />
            <Input label="Email" value={profile?.email ?? ''} disabled />
            <Input label="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
            <Button type="submit" isLoading={updateMutation.isPending} className="self-start">
              Save changes
            </Button>
          </form>
        </CardBody>
      </Card>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Saved addresses</h2>
        {profile?.addresses.length ? (
          <div className="flex flex-col gap-3">
            {profile.addresses.map((address) => (
              <Card key={address.id}>
                <CardBody className="text-sm text-ink/70">
                  <p className="font-medium text-ink">{address.label}</p>
                  {address.line1}, {address.city}, {address.state} {address.postalCode}
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink/50">No saved addresses yet.</p>
        )}
      </div>
    </div>
  );
}
