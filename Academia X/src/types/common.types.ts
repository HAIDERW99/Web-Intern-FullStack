/**
 * Shared utility types used across all modules.
 */

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

/** Generic async operation state */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface FilterConfig {
  [key: string]: string | number | boolean | null;
}

export interface TableQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  sort?: SortConfig;
  filters?: FilterConfig;
}
