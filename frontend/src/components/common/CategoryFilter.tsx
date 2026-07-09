import { cn } from '@/utils/cn';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/Skeleton';

interface CategoryFilterProps {
  selectedSlug?: string;
  onSelect: (slug: string | undefined) => void;
}

export function CategoryFilter({ selectedSlug, onSelect }: CategoryFilterProps) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        className={cn(
          'rounded-lg px-3 py-2 text-left text-sm hover:bg-ink/5',
          !selectedSlug && 'bg-ink/5 font-medium',
        )}
      >
        All categories
      </button>
      {categories?.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.slug)}
          className={cn(
            'flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-ink/5',
            selectedSlug === category.slug && 'bg-ink/5 font-medium',
          )}
        >
          <span>{category.name}</span>
          {typeof category.productCount === 'number' && (
            <span className="text-xs text-ink/40">{category.productCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}
