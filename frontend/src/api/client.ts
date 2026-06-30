import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: ApiError;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000',
  timeout: 120000, // 120s to handle Render free tier cold start (50s+ spin-up)
  headers: {
    'Content-Type': 'application/json',
  },
});

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    try {
      const token = localStorage.getItem('spotter_auth_token');
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
    } catch (e) {
      // Storage access safety recovery
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as CustomAxiosRequestConfig;
    const status = error.response?.status;
    const shouldRetry = !status || (status >= 500 && status <= 599);

    if (shouldRetry && config && (config._retryCount ?? 0) < MAX_RETRIES) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      const delay = RETRY_DELAY_BASE * Math.pow(2, config._retryCount);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(config);
    }

    let parsedError: ApiError = {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected connection issue occurred.',
    };

    if (error.response) {
      const responseData = error.response.data as {
        error?: unknown;
      };
      if (responseData && responseData.error) {
        if (typeof responseData.error === 'object' && responseData.error !== null) {
          const errObj = responseData.error as Record<string, unknown>;
          parsedError = {
            code: typeof errObj.code === 'string' ? errObj.code : 'API_ERROR',
            message: typeof errObj.message === 'string' ? errObj.message : 'Server error occurred',
            details: errObj.details as Record<string, string[]> | undefined,
          };
        } else {
          parsedError = {
            code: 'API_ERROR',
            message: String(responseData.error),
          };
        }
      } else {
        parsedError = {
          code: `HTTP_${error.response.status}_ERROR`,
          message: error.message || 'HTTP transaction status error',
        };
      }
    } else if (error.code === 'ECONNABORTED') {
      parsedError = {
        code: 'TIMEOUT_ERROR',
        message: 'The request timed out. Please try again.',
      };
    } else {
      parsedError = {
        code: 'NETWORK_ERROR',
        message: 'A network error occurred. Please verify your connection.',
      };
    }

    return Promise.reject(parsedError);
  }
);

export default apiClient;
