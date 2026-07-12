import { Spinner } from '@/components/ui/Spinner';

/** Shown by <Suspense> while a lazily-loaded route chunk is being fetched. */
export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
