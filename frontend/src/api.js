import axios from "axios";

const rawUrl = (import.meta.env.VITE_API_URL || "https://karigarbackend.vercel.app").trim();

let normalizedUrl = rawUrl;
if (normalizedUrl && !/^https?:\/\//i.test(normalizedUrl) && !normalizedUrl.startsWith("/")) {
  normalizedUrl = `https://${normalizedUrl}`;
}

export const API_BASE_URL = normalizedUrl.replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;
