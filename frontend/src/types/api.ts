export interface ApiSuccessResponse<T = unknown> {
    success: true;
    message: string;
    data?: T;
  }
  
  export interface ApiErrorResponse {
    success: false;
    message: string;
    errors?: unknown;
    stack?: string;
  }
  
<<<<<<< HEAD
  export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
  
=======
  export interface HealthCheckResponse {
    status: 'ok' | 'degraded';
    uptime: number;
    timestamp: string;
    environment: string;
    database: { status: 'connected' | 'connecting' | 'disconnected' | 'disconnecting' };
  }
>>>>>>> bfea368bc13d06ff4a5284448bc03d74e9a4d1c9
