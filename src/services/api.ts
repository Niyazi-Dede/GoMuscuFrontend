import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const DEFAULT_API_URL = 'http://localhost:8000/api';
const RETRY_META_KEY = '__apiRetryIndex';

function getExpoHost(): string | null {
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (typeof scriptURL !== 'string') {
    return null;
  }

  const match = scriptURL.match(/^https?:\/\/([^/:]+)/i);
  return match?.[1] ?? null;
}

function normalizeApiUrl(url: string): string {
  return url.replace(/\/$/, '');
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function addCandidate(candidates: string[], seen: Set<string>, url: URL) {
  const normalized = normalizeApiUrl(url.toString());
  if (!seen.has(normalized)) {
    seen.add(normalized);
    candidates.push(normalized);
  }
}

function buildApiCandidates(): string[] {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
  const candidates: string[] = [];
  const seen = new Set<string>();

  try {
    const url = new URL(configuredUrl);
    const expoHost = getExpoHost();
    const isConfiguredLocal = isLocalHost(url.hostname);

    if (isConfiguredLocal && expoHost && !isLocalHost(expoHost)) {
      const remoteUrl = new URL(url.toString());
      remoteUrl.hostname = expoHost;
      addCandidate(candidates, seen, remoteUrl);

      if (url.port === '8000') {
        const remoteHttpUrl = new URL(remoteUrl.toString());
        remoteHttpUrl.port = '';
        addCandidate(candidates, seen, remoteHttpUrl);
      }
    }

    if (isConfiguredLocal && Platform.OS === 'android') {
      const emulatorUrl = new URL(url.toString());
      emulatorUrl.hostname = '10.0.2.2';
      addCandidate(candidates, seen, emulatorUrl);

      if (url.port === '8000') {
        const emulatorHttpUrl = new URL(emulatorUrl.toString());
        emulatorHttpUrl.port = '';
        addCandidate(candidates, seen, emulatorHttpUrl);
      }
    }

    addCandidate(candidates, seen, url);

    if (isConfiguredLocal && url.port === '8000') {
      const localHttpUrl = new URL(url.toString());
      localHttpUrl.port = '80';
      addCandidate(candidates, seen, localHttpUrl);
    }

    return candidates;
  } catch {
    return [normalizeApiUrl(configuredUrl)];
  }
}

const API_URL_CANDIDATES = buildApiCandidates();
const API_URL = API_URL_CANDIDATES[0] || DEFAULT_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const retryIndex = (config as any)[RETRY_META_KEY] ?? 0;
      config.baseURL = API_URL_CANDIDATES[retryIndex] || API_URL;

      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as any;
    const retryIndex = config?.[RETRY_META_KEY] ?? 0;
    const nextRetryIndex = retryIndex + 1;
    const hasNetworkError = !error.response;
    const nextBaseUrl = API_URL_CANDIDATES[nextRetryIndex];

    if (config && hasNetworkError && nextBaseUrl) {
      config[RETRY_META_KEY] = nextRetryIndex;
      config.baseURL = nextBaseUrl;
      return api.request(config);
    }

    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }

    return Promise.reject(error);
  }
);

if (__DEV__) {
  console.log('API URL candidates:', API_URL_CANDIDATES);
}

export default api;
