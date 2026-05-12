/**
 * Generic API Response wrapper used by backend
 * All API endpoints return this format
 */
export interface GeneralResponse<T = any> {
  isSuccess: boolean;
  data?: T;
  message?: string;
}
