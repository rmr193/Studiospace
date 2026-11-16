import axios, { AxiosRequestConfig, AxiosError } from "axios";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(
  /\/+$/,
  ""
);

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 20_000,
  headers: { Accept: "application/json" },
});

export interface ApiError extends Error {
  status?: number;
}

/**
 * Thin Axios wrapper that keeps the original fetch-style call signature used
 * across the app. Authentication always relies on the HTTPOnly `token` cookie,
 * so `withCredentials` is enabled instead of reading a token from localStorage.
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

  const body = options.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const config: AxiosRequestConfig = {
    url,
    method: (options.method as AxiosRequestConfig["method"]) || "GET",
    headers: {
      ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...((options.headers as Record<string, string>) || {}),
    },
    data: body,
    withCredentials: true,
    signal: options.signal as AbortSignal | undefined,
  };

  try {
    const response = await api.request<T>(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message =
        axiosError.response?.data?.message ||
        (axiosError.code === "ECONNABORTED"
          ? "The request timed out. Please try again."
          : axiosError.response
            ? `Request failed with status ${axiosError.response.status}`
            : "Cannot reach the StudioSpace API. Check your connection and try again.");

      const apiError: ApiError = new Error(message);
      apiError.status = axiosError.response?.status;
      throw apiError;
    }

    throw error;
  }
}

export async function uploadImageToImgBB(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (apiKey && apiKey !== "your_imgbb_api_key_optional") {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    if (res.ok && json?.data?.url) {
      return json.data.url as string;
    }
  }

  // Client-side compressed Data URL fallback when ImgBB API key is not configured in .env.local
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read image file."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

export function formatHourLabel(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  if (h === 0) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  return h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;
}
