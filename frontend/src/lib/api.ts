import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean
}

let refreshRequest: Promise<void> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined
    const isAdminLogin = config?.url?.includes("/auth/admin/login")
    const isRefresh = config?.url?.includes("/auth/refresh")

    if (
      error.response?.status !== 401
      || !config
      || config._authRetry
      || isAdminLogin
      || isRefresh
    ) {
      return Promise.reject(error)
    }

    config._authRetry = true

    try {
      if (!refreshRequest) {
        refreshRequest = axios
          .post(`${API_BASE_URL}/auth/refresh`, undefined, { withCredentials: true })
          .then(() => undefined)
          .finally(() => {
            refreshRequest = null
          })
      }

      await refreshRequest
      return api(config)
    } catch {
      return Promise.reject(error)
    }
  },
)

export default api
