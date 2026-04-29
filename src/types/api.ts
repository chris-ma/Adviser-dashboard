export interface ApiMeta {
  total?: number;
  page?: number;
  pageSize?: number;
  source: string;
  asAtDate: string;
  generatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
  error?: string;
}
