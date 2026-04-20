import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

const DEFAULT_API_URL = 'http://localhost:8000/api';
const API_PROBE_PATH = '/login';
const API_PROBE_TIMEOUT = 1200;
const RETRY_META_KEY = '__apiRetryIndex';
const RESOLVED_URL_STORAGE_KEY = 'apiResolvedUrl';

type UnauthorizedHandler = () => void | Promise<void>;

function getExpoHost(): string | null {
  // 1. Expo Go config (iOS + Android dans Expo Go)
  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (debuggerHost) return debuggerHost.split(':')[0];

  // 2. Manifest classique (dev builds, anciennes versions Expo)
  const manifest = Constants.manifest as any;
  if (manifest?.debuggerHost) return manifest.debuggerHost.split(':')[0];
  if (manifest?.hostUri) return manifest.hostUri.split(':')[0];

  // 3. Manifest2 (Expo SDK 46+)
  const manifest2 = Constants.manifest2 as any;
  const m2Host = manifest2?.extra?.expoGo?.debuggerHost;
  if (m2Host) return m2Host.split(':')[0];

  // 4. Fallback Android NativeModules
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (typeof scriptURL === 'string') {
    const match = scriptURL.match(/^https?:\/\/([^/:]+)/i);
    return match?.[1] ?? null;
  }

  return null;
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
let authToken: string | null = null;
let authTokenLoaded = false;
let resolvedApiUrl: string | null = null;
let apiUrlResolutionPromise: Promise<string> | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setApiAuthToken(token: string | null) {
  authToken = token;
  authTokenLoaded = true;
}

export function setApiUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

async function getApiAuthToken(): Promise<string | null> {
  if (authTokenLoaded) {
    return authToken;
  }

  authTokenLoaded = true;

  try {
    authToken = await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error retrieving token:', error);
    authToken = null;
  }

  return authToken;
}

function setRequestHeader(config: any, name: string, value: string | null) {
  const headers = (config.headers ??= {});

  if (typeof headers.set === 'function') {
    if (value === null) {
      headers.delete?.(name);
    } else {
      headers.set(name, value);
    }
    return;
  }

  if (value === null) {
    delete headers[name];
  } else {
    headers[name] = value;
  }
}

async function probeApiCandidate(candidate: string): Promise<boolean> {
  try {
    const response = await axios.request({
      baseURL: candidate,
      url: API_PROBE_PATH,
      method: 'OPTIONS',
      timeout: API_PROBE_TIMEOUT,
      validateStatus: () => true,
    });

    return response.status < 500;
  } catch {
    return false;
  }
}

async function probeCandidatesInParallel(): Promise<string | null> {
  if (API_URL_CANDIDATES.length === 0) return null;

  return new Promise<string | null>((resolve) => {
    let settled = false;
    let remaining = API_URL_CANDIDATES.length;

    API_URL_CANDIDATES.forEach((candidate) => {
      probeApiCandidate(candidate).then((ok) => {
        remaining -= 1;
        if (ok && !settled) {
          settled = true;
          resolve(candidate);
        } else if (remaining === 0 && !settled) {
          settled = true;
          resolve(null);
        }
      });
    });
  });
}

async function resolveApiUrl(): Promise<string> {
  if (resolvedApiUrl) {
    return resolvedApiUrl;
  }

  if (apiUrlResolutionPromise) {
    return apiUrlResolutionPromise;
  }

  apiUrlResolutionPromise = (async () => {
    try {
      const cached = await AsyncStorage.getItem(RESOLVED_URL_STORAGE_KEY);
      if (cached && API_URL_CANDIDATES.includes(cached)) {
        resolvedApiUrl = cached;
        return cached;
      }
    } catch {}

    const picked = await probeCandidatesInParallel();
    const chosen = picked ?? API_URL;
    resolvedApiUrl = chosen;
    AsyncStorage.setItem(RESOLVED_URL_STORAGE_KEY, chosen).catch(() => {});
    return chosen;
  })();

  try {
    return await apiUrlResolutionPromise;
  } finally {
    apiUrlResolutionPromise = null;
  }
}

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
      const retryIndex = (config as any)[RETRY_META_KEY];
      config.baseURL =
        typeof retryIndex === 'number'
          ? API_URL_CANDIDATES[retryIndex] || resolvedApiUrl || API_URL
          : await resolveApiUrl();

      const token = await getApiAuthToken();
      if (token) {
        setRequestHeader(config, 'Authorization', `Bearer ${token}`);
      } else {
        setRequestHeader(config, 'Authorization', null);
      }
    } catch (error) {
      console.error('Error preparing request:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (response.config.baseURL) {
      const url = normalizeApiUrl(response.config.baseURL);
      if (resolvedApiUrl !== url) {
        resolvedApiUrl = url;
        AsyncStorage.setItem(RESOLVED_URL_STORAGE_KEY, url).catch(() => {});
      }
    }

    return response;
  },
  async (error) => {
    const config = error.config as any;
    const retryIndex = config?.[RETRY_META_KEY] ?? 0;
    const nextRetryIndex = retryIndex + 1;
    const hasNetworkError = !error.response;
    const nextBaseUrl = API_URL_CANDIDATES[nextRetryIndex];

    if (config && hasNetworkError && nextBaseUrl) {
      resolvedApiUrl = null;
      AsyncStorage.removeItem(RESOLVED_URL_STORAGE_KEY).catch(() => {});
      config[RETRY_META_KEY] = nextRetryIndex;
      config.baseURL = nextBaseUrl;
      return api.request(config);
    }

    const requestUrl = String(config?.url ?? '');
    const isPublicAuthRequest = requestUrl.endsWith('/login') || requestUrl.endsWith('/register');

    if (error.response?.status === 401 && !isPublicAuthRequest) {
      setApiAuthToken(null);
      await AsyncStorage.multiRemove(['token', 'user']).catch((storageError) =>
        console.error('Error clearing auth storage:', storageError)
      );
      await unauthorizedHandler?.();
    }

    return Promise.reject(error);
  }
);

if (__DEV__) {
  const detectedHost = getExpoHost();
  console.log('[API] Expo host detected:', detectedHost ?? 'NONE (fallback to localhost)');
  console.log('[API] URL candidates:', API_URL_CANDIDATES);
  console.log('[API] Primary URL:', API_URL);
  console.log('[API] Probe path:', API_PROBE_PATH);
}

export default api;
