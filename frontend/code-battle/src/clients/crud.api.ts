// frontend\code-battle\src\clients\crud.api.ts
import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 10000,
  withCredentials: true,
});

// Helper: retry request
async function retryRequest<T>(
  error: AxiosError<T>,
  retries: number,
  delay: number
): Promise<any> {
  if (retries <= 0 || !error.config) throw error;
  await new Promise((res) => setTimeout(res, delay));
  return api.request(error.config);
}

// Global response interceptor with retry
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    let message = "Unexpected error occurred.";

    // Retry on network error or 5xx
    if (
      (!error.response || (error.response.status >= 500 && error.response.status < 600)) &&
      !(error.config as any)?._retry
    ) {
      (error.config as any)._retry = true; // mark as retried
      return retryRequest(error, 2, 1000); // 2 retries with 1s delay
    }

    if (error.code === "ERR_NETWORK" && !error.response) {
      message = !navigator.onLine
        ? "You are offline. Please check your internet connection."
        : "Cannot reach the server. It may be down.";
    } else if (error.response) {
      const status = error.response.status;

      if (error.response.data && typeof error.response.data === "object") {
        const res = error.response.data as any;
        if (res.message) message = res.message;
      }

      if (!message) {
        if (status === 400) message = "Bad request.";
        else if (status === 401) message = "Unauthorized.";
        else if (status === 403) message = "Forbidden.";
        else if (status === 500) message = "Server error. Try again later.";
        else message = `Error ${status}`;
      }
    }

    (error as any).customMessage = message;
    return Promise.reject(error);
  }
);

export default api;
