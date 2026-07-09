export function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  
  export function isStrongPassword(value: string): boolean {
    return value.length >= 8;
  }
  
  export function required(value: unknown): boolean {
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && value !== undefined;
  }
  