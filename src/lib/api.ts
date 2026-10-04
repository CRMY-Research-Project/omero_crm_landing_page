// Pure helpers for talking to the landing-page search endpoint.
// Kept free of Svelte/browser dependencies so they are unit-testable.

export interface SearchItem {
  id: number;
  name: string;
  dataset_id: number;
  dataset_name: string;
  project_id: number;
  project_description: string;
}

export interface SearchResponse {
  success: boolean;
  total: number;
  page: number;
  page_size: number;
  dataset_count: number;
  projects: { id: number; name: string; description: string }[];
  items: SearchItem[];
}

export interface TableRow {
  id: number;
  src: string;
  datasetId: number;
  datasetName: string;
  imageName: string;
  projectDescription: string;
}

export const SEARCH_URL = "/omero_crm_landing_page/search/";
export const THUMBNAIL_URL = "/webgateway/render_thumbnail/";
export const GATE_BASE = "/omero_download_gate";
// Same-origin OMERO.web mounts each app at /<app_name>/ (see docker
// config.omero / 01-default-webapps.omero), so these relative bases resolve
// against whatever host serves the landing page.
export const WEBIMPORT_BASE = "/omero_webimport";
export const PORTAL_BASE = "/omero_crm_landing_page";

export interface DownloadStatus {
  success: boolean;
  image_id: number;
  can_download: boolean;
  reason: "admin" | "owner" | "approved" | "not_approved";
  has_pending_request: boolean;
  dataset_ids: number[];
}

/** Download-gate endpoint URLs (kept as pure builders for testability). */
export function gateStatusUrl(imageId: number, base = GATE_BASE): string {
  return `${base}/status/image/${imageId}/`;
}
export function gateDownloadUrl(imageId: number, base = GATE_BASE): string {
  return `${base}/download/image/${imageId}/`;
}
export function gateRequestUrl(base = GATE_BASE): string {
  return `${base}/request/`;
}

// --------------------------------------------------------------------------
// Researcher-dashboard endpoints ("My Portal") — all same-origin GET/JSON.
// --------------------------------------------------------------------------

/** A user's own download-access request (gate `requests/mine/`). */
export interface GateRequest {
  id: string;
  target_type: "image" | "dataset";
  target_id: number;
  reason: string;
  documents: string[];
  documents_detail: { filename: string; type: string | null }[];
  status: "pending" | "approved" | "denied";
  created_at: string;
  reviewed_at: string | null;
  review_note: string;
  expires_at: string | null;
}

/** A user's active access grant (gate `grants/mine/`). */
export interface GateGrant {
  id: string;
  principal: string;
  scope_type: "image" | "dataset" | "project";
  scope_id: number;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  reason: string;
  request_id: string | null;
  revoked: boolean;
  revoked_by: string | null;
  revoked_at: string | null;
  active: boolean;
}

/** Async webimport job status (webimport `upload/status/<job_id>/`). */
export interface ImportJobStatus {
  success: boolean;
  status: "running" | "done" | "failed";
  image_ids: number[];
  warning: string | null;
  error: string | null;
}

/** Current-user summary from the landing app (`portal/summary/`). */
export interface PortalSummary {
  success: boolean;
  authenticated: boolean; // true when the visitor is NOT the public user
  is_public: boolean;
  username: string;
  full_name: string;
  is_admin: boolean;
  login_url: string;
  logout_url: string;
  counts?: { projects: number; datasets: number };
}

export function gateMyRequestsUrl(base = GATE_BASE): string {
  return `${base}/requests/mine/`;
}
export function gateMyGrantsUrl(base = GATE_BASE, activeOnly = true): string {
  return activeOnly ? `${base}/grants/mine/` : `${base}/grants/mine/?active=0`;
}
/**
 * Deep link into the gate's "My access" browser, opened at one grant.
 *
 * @param grantId - The grant to expand (its 32-hex id).
 * @param base - Gate mount point; defaults to GATE_BASE.
 * @returns The gate page URL with a `#grant-<id>` fragment.
 */
export function gateAccessUrl(grantId: string, base = GATE_BASE): string {
  return `${base}/#grant-${grantId}`;
}
export function webimportIndexUrl(base = WEBIMPORT_BASE): string {
  return `${base}/`;
}
export function webimportStatusUrl(jobId: string, base = WEBIMPORT_BASE): string {
  return `${base}/upload/status/${jobId}/`;
}
export function portalSummaryUrl(base = PORTAL_BASE): string {
  return `${base}/portal/summary/`;
}

// --- pure presentation helpers (unit-tested, no DOM) ----------------------

export type PillTone = "approved" | "pending" | "denied" | "neutral";

/** Map a request/grant/job state to a specimen-label pill tone.
 *  approved/active/done -> brass, pending/running -> ochre,
 *  denied/revoked/expired/failed -> mulberry. */
export function pillTone(state: string): PillTone {
  const s = (state || "").toLowerCase();
  if (["approved", "active", "done", "granted"].includes(s)) return "approved";
  if (["pending", "running"].includes(s)) return "pending";
  if (["denied", "revoked", "expired", "failed"].includes(s)) return "denied";
  return "neutral";
}

/** Collapse a grant's server flags to a single status word. The server
 *  already computes `active` (unrevoked AND unexpired), so trust it first. */
export function grantStatus(
  grant: Pick<GateGrant, "active" | "revoked">
): "active" | "revoked" | "expired" {
  if (grant.active) return "active";
  if (grant.revoked) return "revoked";
  return "expired";
}

/** Human, injectable-clock expiry label for a grant/request row. */
export function formatExpiry(
  expiresAt: string | null | undefined,
  nowMs: number = Date.now()
): string {
  if (!expiresAt) return "No expiry";
  const t = Date.parse(expiresAt);
  if (Number.isNaN(t)) return "No expiry";
  const diffMs = t - nowMs;
  if (diffMs <= 0) return "Expired";
  const days = Math.ceil(diffMs / 86_400_000);
  if (days === 1) return "Expires in 1 day";
  if (days <= 60) return `Expires in ${days} days`;
  return `Expires ${new Date(t).toISOString().slice(0, 10)}`;
}

/** "Image #12" / "Dataset #3" — a grant's scope in one label. */
export function scopeLabel(scopeType: string, scopeId: number): string {
  const t = scopeType
    ? scopeType.charAt(0).toUpperCase() + scopeType.slice(1)
    : "Scope";
  return `${t} #${scopeId}`;
}

/** ISO timestamp -> YYYY-MM-DD, or an em dash when absent/invalid. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toISOString().slice(0, 10);
}

/** Read a cookie value (Django sets `csrftoken`); "" if absent. */
export function getCookie(name: string, cookieString = ""): string {
  const src =
    cookieString || (typeof document !== "undefined" ? document.cookie : "");
  for (const part of src.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return "";
}

export function thumbnailSrc(imageId: number, size = 128): string {
  return `${THUMBNAIL_URL}${imageId}/?size=${size}`;
}

/** Map a search item to the row shape ProjectTable renders. */
export function toTableRow(item: SearchItem): TableRow {
  return {
    id: item.id,
    src: thumbnailSrc(item.id),
    datasetId: item.dataset_id,
    datasetName: item.dataset_name,
    imageName: item.name || "Unnamed Image",
    projectDescription: item.project_description || "N/A",
  };
}

/** Build the search endpoint URL with encoded parameters. */
export function searchUrl(
  query: string,
  page: number,
  pageSize: number,
  base: string = SEARCH_URL
): string {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    page_size: String(pageSize),
  });
  return `${base}?${params.toString()}`;
}

/** Debounce a zero-arg function; trailing-edge only. */
export function debounce(fn: () => void, waitMs: number): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(fn, waitMs);
  };
}
