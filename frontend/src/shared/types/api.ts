export interface ApiResponse<T> {
  success: boolean;
  messageCode: string;
  message: string;
  data: T;
  errors?: unknown;
  timestamp?: string;
  path?: string;
}
