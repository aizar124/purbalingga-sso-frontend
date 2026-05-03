const normalizeUrl = (value: string | undefined, fallback: string) => {
  const raw = (value || fallback).trim();
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
};

export const SSO_BASE_URL = normalizeUrl(
  import.meta.env.VITE_SSO_URL,
  'https://apisso.qode.my.id'
);
export const SSO_REDIRECT_URI = normalizeUrl(
  import.meta.env.VITE_SSO_REDIRECT_URI,
  'https://sso.qode.my.id/callback'
);
export const PAY_REDIRECT_URI = normalizeUrl(
  import.meta.env.VITE_PAY_REDIRECT_URI,
  'https://smartpay.qode.my.id/callback'
);
export const PAY_HOME_URL = normalizeUrl(
  import.meta.env.VITE_PAY_HOME_URL,
  'https://smartpay.qode.my.id'
);
export const SMARTCITY_HOME_URL = normalizeUrl(
  import.meta.env.VITE_SMARTCITY_HOME_URL,
  'https://smartcity.qode.my.id'
);
export const DEFAULT_SCOPE = import.meta.env.VITE_SCOPE || 'openid profile email';
