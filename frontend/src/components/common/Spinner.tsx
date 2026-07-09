import { cn } from '@utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const SIZE_CLASSES: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
};

export function Spinner({ size = 'md', className, label = 'Loading...' }: SpinnerProps) {
  return (
    <div
      role="status"
      className={cn('inline-flex items-center justify-center text-primary-600', className)}
    >
      <span
        className={cn(
          'animate-spin rounded-full border-current border-t-transparent',
          SIZE_CLASSES[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Full-page centered spinner, used as the router's fallback while a lazy route loads. */
export function PageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}