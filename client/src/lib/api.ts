const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("veda_token") : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({ message: res.statusText }));

  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? "Request failed");
  }

  return data as T;
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("veda_token") : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json().catch(() => ({ message: res.statusText }));

  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? "Upload failed");
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload,
};

export { ApiError };
export { BASE_URL };
