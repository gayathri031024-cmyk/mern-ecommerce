import { LucideIcon } from 'lucide-react';

import { Card, CardBody } from '@/components/ui/Card';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className="rounded-xl bg-accent/10 p-3 text-accent">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-ink/50">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
          {trend && <p className="text-xs text-emerald-600">{trend}</p>}
        </div>
      </CardBody>
    </Card>
  );
}
