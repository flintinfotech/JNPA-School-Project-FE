"use client";

// ─── UI Domains ───────────────────────────────────────────────
export const LOCAL_UI_DOMAIN = "http://localhost:5173";
export const DEV_UI_DOMAIN = "http://flintinfotech-dev.in:8445";
export const PROD_UI_DOMAIN = ""; // TODO: set when production is ready

// ─── Backend Domains ──────────────────────────────────────────
export const DEV_BE_DOMAIN = "http://flintinfotech-dev.in:8443";
export const PROD_BE_DOMAIN = ""; // TODO: set when production is ready

// ─── Runtime Detection (lazy function) ───────────────────────
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return DEV_BE_DOMAIN; // SSR fallback — dev-only setup for now
  }

  const href = window.location.href;

  if (href.includes("localhost")) return DEV_BE_DOMAIN;
  if (href.includes(DEV_UI_DOMAIN)) return DEV_BE_DOMAIN;
  if (PROD_UI_DOMAIN && href.includes(PROD_UI_DOMAIN)) return PROD_BE_DOMAIN;

  return DEV_BE_DOMAIN; // safe default while only dev exists
}

// ─── Backward-compatible default export (keeps `config.baseURL` usage working) ───
const config = {
  baseURL: getApiBaseUrl(),
};

export default config;