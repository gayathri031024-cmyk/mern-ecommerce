import { ReactNode, useRef, useState } from 'react';

import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/utils/cn';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, children, align = 'right' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false));

  return (
    <div ref={containerRef} className="relative inline-block">
      <div onClick={() => setIsOpen((current) => !current)}>{trigger}</div>
      {isOpen && (
        <div
          className={cn(
            'absolute z-40 mt-2 min-w-[180px] rounded-xl border border-border bg-white p-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-ink/5',
        className,
      )}
      {...props}
    />
  );
}