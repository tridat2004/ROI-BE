export function successResponse<T>({
  message,
  data,
  meta,
}: {
  message: string;
  data: T;
  meta?: Record<string, any>;
}) {
  const response: Record<string, any> = {
    status_code: 200,
    message,
    error: null,
    data,
  };

  if (meta) response['meta'] = meta;

  return response;
}
