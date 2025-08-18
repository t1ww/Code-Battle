// frontend\code-battle\src\clients\crud.api.ts
import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: true,
});

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    let message = "Unexpected error occurred.";

    if (error.code === "ERR_NETWORK" && !error.response) {
      message = !navigator.onLine
        ? "You are offline. Please check your internet connection."
        : "Cannot reach the server. It may be down.";
    } else if (error.response) {
      const status = error.response.status;

      // Optional: API error message pass-through
      if (error.response.data && typeof error.response.data === "object") {
        const res = error.response.data as any;
        if (res.message) {
          message = res.message;
        }
      }

      if (!message) {
        if (status === 400) message = "Bad request.";
        else if (status === 401) message = "Unauthorized.";
        else if (status === 403) message = "Forbidden.";
        else if (status === 500) message = "Server error. Try again later.";
        else message = `Error ${status}`;
      }
    }

    // Attach custom message
    (error as any).customMessage = message;
    return Promise.reject(error);
  }
);

export default api;
