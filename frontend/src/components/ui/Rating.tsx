import { Star } from 'lucide-react';

import { cn } from '@/utils/cn';

interface RatingProps {
  value: number;
  count?: number;
  size?: number;
}

export function Rating({ value, count, size = 16 }: RatingProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex" aria-label={`Rated ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            width={size}
            height={size}
            className={cn(
              star <= Math.round(value) ? 'fill-accent text-accent' : 'fill-transparent text-ink/20',
            )}
          />
        ))}
      </div>
      {typeof count === 'number' && <span className="text-xs text-ink/50">({count})</span>}
    </div>
  );
}
