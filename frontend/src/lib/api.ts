import axios from "axios"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export default api
