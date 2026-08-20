export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function normalizePagination(params: PaginationParams): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(params.pageSize ?? DEFAULT_PAGE_SIZE))
  );
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
  items: unknown[]
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
    nextCursor:
      items.length === pageSize ? String(page + 1) : undefined,
  };
}

export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return {
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
    nextCursor: items.length === pageSize ? String(page + 1) : undefined,
  };
}
