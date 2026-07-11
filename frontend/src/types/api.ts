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
  
  export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
  
  export interface HealthCheckResponse {
    status: 'ok' | 'degraded';
    uptime: number;
    timestamp: string;
    environment: string;
    database: { status: 'connected' | 'connecting' | 'disconnected' | 'disconnecting' };
  }
  