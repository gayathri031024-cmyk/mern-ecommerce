export const ROLES = {
    CUSTOMER: 'customer',
    ADMIN: 'admin',
    VENDOR: 'vendor',
  } as const;
  
  export type Role = (typeof ROLES)[keyof typeof ROLES];
  
  export const ALL_ROLES: Role[] = Object.values(ROLES);