import axios from "axios";
import { getSession } from "next-auth/react";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add interceptors for request/response
axiosInstance.interceptors.request.use(
  async (config) => {
    // Add authorization token if available
    const session = await getSession();
    if (session?.user?.idToken) {
      // Check if the JWT exists in the session
      // Add the JWT to the Authorization header as Bearer token
      config.headers.Authorization = `Bearer ${session.user.idToken}`;
    }

    if (session?.user?.id) {
      config.headers["x-user-id"] = session.user.id; // Add x-user-id header
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
