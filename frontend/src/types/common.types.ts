export interface ApiSuccess<T> {
    success: true;
    message?: string;
    data: T;
  }
  
  export interface ApiError {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
  }
  
  export interface PaginationMeta {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  }
  
  export interface PaginatedResponse<T> {
    items: T[];
    meta: PaginationMeta;
  }
  
  export interface QueryParams {
    page?: number;
    limit?: number;
    sort?: string;
    search?: string;
    [key: string]: string | number | boolean | undefined;
  }
  
  export type SelectOption = {
    label: string;
    value: string;
  };
  