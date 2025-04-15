import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://localhost:3000/api', // Set the base URL to your Next.js API
  timeout: 5000, // Timeout after 5 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;