import { describe, expect, it, vi } from "vitest";
import {
  debounce,
  formatDate,
  formatExpiry,
  gateDownloadUrl,
  gateAccessUrl,
  gateMyGrantsUrl,
  gateMyRequestsUrl,
  gateRequestUrl,
  gateStatusUrl,
  getCookie,
  grantStatus,
  pillTone,
  portalSummaryUrl,
  scopeLabel,
  searchUrl,
  thumbnailSrc,
  toTableRow,
  webimportIndexUrl,
  webimportStatusUrl,
  type SearchItem,
} from "./api";

describe("thumbnailSrc", () => {
  it("builds the webgateway thumbnail URL", () => {
    expect(thumbnailSrc(42)).toBe("/webgateway/render_thumbnail/42/?size=128");
    expect(thumbnailSrc(7, 256)).toBe(
      "/webgateway/render_thumbnail/7/?size=256"
    );
  });
});

describe("searchUrl", () => {
  it("encodes query parameters", () => {
    expect(searchUrl("CD3 slide", 2, 5)).toBe(
      "/omero_crm_landing_page/search/?q=CD3+slide&page=2&page_size=5"
    );
  });

  it("handles special characters in the query", () => {
    const url = searchUrl("a&b=c", 1, 5);
    expect(url).toContain("q=a%26b%3Dc");
  });

  it("accepts a custom base", () => {
    expect(searchUrl("", 1, 10, "/custom/")).toBe(
      "/custom/?q=&page=1&page_size=10"
    );
  });
});

describe("toTableRow", () => {
  const item: SearchItem = {
    id: 9,
    name: "SD0014 CD3 CT.svs",
    dataset_id: 3,
    dataset_name: "SD0014",
    project_id: 1,
    project_description: "Breast cancer dataset",
  };

  it("maps the search item to the table row shape", () => {
    expect(toTableRow(item)).toEqual({
      id: 9,
      src: "/webgateway/render_thumbnail/9/?size=128",
      datasetId: 3,
      datasetName: "SD0014",
      imageName: "SD0014 CD3 CT.svs",
      projectDescription: "Breast cancer dataset",
    });
  });

  it("fills defaults for missing name and description", () => {
    const row = toTableRow({ ...item, name: "", project_description: "" });
    expect(row.imageName).toBe("Unnamed Image");
    expect(row.projectDescription).toBe("N/A");
  });
});

describe("download-gate URLs", () => {
  it("builds status, download and request URLs", () => {
    expect(gateStatusUrl(42)).toBe("/omero_download_gate/status/image/42/");
    expect(gateDownloadUrl(42)).toBe("/omero_download_gate/download/image/42/");
    expect(gateRequestUrl()).toBe("/omero_download_gate/request/");
  });
});

describe("dashboard endpoint URLs", () => {
  it("builds the my-requests and my-grants URLs", () => {
    expect(gateMyRequestsUrl()).toBe("/omero_download_gate/requests/mine/");
    expect(gateMyGrantsUrl()).toBe("/omero_download_gate/grants/mine/");
    expect(gateMyGrantsUrl(undefined, false)).toBe(
      "/omero_download_gate/grants/mine/?active=0"
    );
  });
  it("deep-links a grant into the gate's My access browser", () => {
    expect(gateAccessUrl("a".repeat(32))).toBe(
      "/omero_download_gate/#grant-" + "a".repeat(32)
    );
  });

  it("builds the webimport index + status URLs", () => {
    expect(webimportIndexUrl()).toBe("/omero_webimport/");
    expect(webimportStatusUrl("a".repeat(32))).toBe(
      `/omero_webimport/upload/status/${"a".repeat(32)}/`
    );
  });

  it("builds the portal summary URL", () => {
    expect(portalSummaryUrl()).toBe("/omero_crm_landing_page/portal/summary/");
  });

  it("accepts custom bases", () => {
    expect(gateMyRequestsUrl("/g")).toBe("/g/requests/mine/");
    expect(webimportIndexUrl("/w")).toBe("/w/");
  });
});

describe("pillTone", () => {
  it("maps states to status-label tones", () => {
    expect(pillTone("approved")).toBe("approved");
    expect(pillTone("ACTIVE")).toBe("approved");
    expect(pillTone("done")).toBe("approved");
    expect(pillTone("pending")).toBe("pending");
    expect(pillTone("running")).toBe("pending");
    expect(pillTone("denied")).toBe("denied");
    expect(pillTone("revoked")).toBe("denied");
    expect(pillTone("expired")).toBe("denied");
    expect(pillTone("failed")).toBe("denied");
    expect(pillTone("whatever")).toBe("neutral");
    expect(pillTone("")).toBe("neutral");
  });
});

describe("grantStatus", () => {
  it("prefers the server-computed active flag", () => {
    expect(grantStatus({ active: true, revoked: false })).toBe("active");
    expect(grantStatus({ active: false, revoked: true })).toBe("revoked");
    expect(grantStatus({ active: false, revoked: false })).toBe("expired");
  });
});

describe("formatExpiry", () => {
  const now = Date.parse("2026-07-19T00:00:00Z");
  it("labels standing / invalid as no expiry", () => {
    expect(formatExpiry(null, now)).toBe("No expiry");
    expect(formatExpiry("", now)).toBe("No expiry");
    expect(formatExpiry("not-a-date", now)).toBe("No expiry");
  });
  it("labels past expiries as expired", () => {
    expect(formatExpiry("2026-07-18T00:00:00Z", now)).toBe("Expired");
  });
  it("counts down whole days", () => {
    expect(formatExpiry("2026-07-20T00:00:00Z", now)).toBe("Expires in 1 day");
    expect(formatExpiry("2026-07-24T00:00:00Z", now)).toBe("Expires in 5 days");
  });
  it("shows a date for far-future expiries", () => {
    expect(formatExpiry("2026-12-31T00:00:00Z", now)).toBe("Expires 2026-12-31");
  });
});

describe("scopeLabel & formatDate", () => {
  it("labels a grant scope", () => {
    expect(scopeLabel("image", 12)).toBe("Image #12");
    expect(scopeLabel("dataset", 3)).toBe("Dataset #3");
  });
  it("formats an ISO date to a day, em dash when absent", () => {
    expect(formatDate("2026-07-19T09:30:00Z")).toBe("2026-07-19");
    expect(formatDate(null)).toBe("-");
    expect(formatDate("nope")).toBe("-");
  });
});

describe("getCookie", () => {
  it("extracts a named cookie value", () => {
    const cookies = "sessionid=abc; csrftoken=tok123; other=x";
    expect(getCookie("csrftoken", cookies)).toBe("tok123");
    expect(getCookie("sessionid", cookies)).toBe("abc");
  });
  it("returns empty string when absent", () => {
    expect(getCookie("csrftoken", "sessionid=abc")).toBe("");
  });
  it("decodes url-encoded values", () => {
    expect(getCookie("t", "t=a%20b")).toBe("a b");
  });
});

describe("debounce", () => {
  it("collapses rapid calls into one trailing call", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);

    debounced();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
