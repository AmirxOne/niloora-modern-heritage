export async function parseJsonResponse<T = unknown>(response: Response): Promise<{
  status: number;
  json: T;
}> {
  const json = (await response.json()) as T;
  return { status: response.status, json };
}
