/**
 * Generic API Response wrapper used by backend
 * All API endpoints return this format:
 * { isSuccess: boolean, data: T, message?: string }
 */
export interface GeneralResponse<T = any> {
  isSuccess: boolean;
  data?: T;
  message?: string;
}

/**
 * Alias for GeneralResponse — use this in Auth/User/Admin modules
 * to stay consistent with the shared wrapper
 */
export type ApiResponse<T = any> = GeneralResponse<T>;
