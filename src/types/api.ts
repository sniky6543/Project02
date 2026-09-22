export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface PaginatedData<T> {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  items: T[];
}
