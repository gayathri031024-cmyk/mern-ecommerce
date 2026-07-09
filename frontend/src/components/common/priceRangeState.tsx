import { FormEvent, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface PriceRangeFilterProps {
  minPrice?: number;
  maxPrice?: number;
  onApply: (min?: number, max?: number) => void;
}

export function PriceRangeFilter({ minPrice, maxPrice, onApply }: PriceRangeFilterProps) {
  const [min, setMin] = useState(minPrice?.toString() ?? '');
  const [max, setMax] = useState(maxPrice?.toString() ?? '');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onApply(min ? Number(min) : undefined, max ? Number(max) : undefined);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          type="number"
          inputMode="numeric"
          placeholder="Min"
          value={min}
          onChange={(event) => setMin(event.target.value)}
          aria-label="Minimum price"
        />
        <Input
          type="number"
          inputMode="numeric"
          placeholder="Max"
          value={max}
          onChange={(event) => setMax(event.target.value)}
          aria-label="Maximum price"
        />
      </div>
      <Button type="submit" variant="outline" size="sm">
        Apply
      </Button>
    </form>
  );
}
