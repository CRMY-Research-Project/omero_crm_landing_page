<script lang="ts">
  import { onMount } from "svelte";
  import {
    GATE_BASE,
    gateAccessUrl,
    gateMyRequestsUrl,
    gateMyGrantsUrl,
    webimportIndexUrl,
    pillTone,
    grantStatus,
    formatExpiry,
    scopeLabel,
    formatDate,
    type GateRequest,
    type GateGrant,
    type PortalSummary,
  } from "./lib/api";

  export let summary: PortalSummary | null = null;
  export let onBrowse: () => void = () => {};

  let requests: GateRequest[] = [];
  let grants: GateGrant[] = [];
  let loading = true;
  let error = "";

  async function load() {
    loading = true;
    error = "";
    try {
      const [rRes, gRes] = await Promise.all([
        fetch(gateMyRequestsUrl()),
        fetch(gateMyGrantsUrl(undefined, false)),
      ]);
      if (rRes.ok) {
        const d = await rRes.json();
        requests = d.requests ?? [];
      }
      if (gRes.ok) {
        const d = await gRes.json();
        grants = d.grants ?? [];
      }
    } catch {
      error = "Could not load your portal data. Please try again.";
    } finally {
      loading = false;
    }
  }

  onMount(load);

  $: activeGrants = grants.filter((g) => g.active).length;
  $: pendingRequests = requests.filter((r) => r.status === "pending").length;
</script>

<section class="portal">
  <header class="portal-head">
    <h1>Welcome{summary?.full_name ? `, ${summary.full_name}` : ""}</h1>
    <p class="muted">
      Your download requests, active access grants, and uploads in one place.
    </p>
  </header>

  <div class="quick-actions">
    <a class="qa" href={webimportIndexUrl()}>
      <span class="qa-title">Upload slides</span>
      <span class="qa-sub">Import new images</span>
    </a>
    <a class="qa" href={`${GATE_BASE}/`}>
      <span class="qa-title">Request access</span>
      <span class="qa-sub">Submit a download request</span>
    </a>
    <button class="qa" type="button" on:click={onBrowse}>
      <span class="qa-title">Browse gallery</span>
      <span class="qa-sub">Explore the public corpus</span>
    </button>
    {#if summary?.is_admin}
      <a class="qa" href={`${GATE_BASE}/review/`}>
        <span class="qa-title">Governance console</span>
        <span class="qa-sub">Review &amp; approve</span>
      </a>
    {/if}
  </div>

  {#if error}
    <p class="empty">{error}</p>
  {:else if loading}
    <p class="empty">Loading your portal...</p>
  {:else}
    <div class="stat-row">
      <div class="stat"><span class="stat-n">{pendingRequests}</span> pending {pendingRequests === 1 ? "request" : "requests"}</div>
      <div class="stat"><span class="stat-n">{activeGrants}</span> active {activeGrants === 1 ? "grant" : "grants"}</div>
    </div>

    <div class="panel">
      <h2 class="section-label">My access requests</h2>
      {#if requests.length === 0}
        <p class="empty">No requests yet. Submit one from "Request access".</p>
      {:else}
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Target</th><th>Status</th><th>Requested</th>
                <th>Reviewed</th><th>Access expiry</th>
              </tr>
            </thead>
            <tbody>
              {#each requests as r (r.id)}
                <tr>
                  <td class="mono">{scopeLabel(r.target_type, r.target_id)}</td>
                  <td><span class="pill pill--{pillTone(r.status)}">{r.status}</span></td>
                  <td class="mono">{formatDate(r.created_at)}</td>
                  <td class="mono">{formatDate(r.reviewed_at)}</td>
                  <td class="mono">{r.expires_at ? formatExpiry(r.expires_at) : "-"}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <div class="panel">
      <h2 class="section-label">My access grants</h2>
      {#if grants.length === 0}
        <p class="empty">No access grants yet. Approved requests appear here.</p>
      {:else}
        <div class="table-scroll">
          <table>
            <thead>
              <tr><th>Scope</th><th>Status</th><th>Granted</th><th>Expiry</th><th>Access</th></tr>
            </thead>
            <tbody>
              {#each grants as g (g.id)}
                <tr>
                  <td class="mono">{scopeLabel(g.scope_type, g.scope_id)}</td>
                  <td><span class="pill pill--{pillTone(grantStatus(g))}">{grantStatus(g)}</span></td>
                  <td class="mono">{formatDate(g.granted_at)}</td>
                  <td class="mono">{formatExpiry(g.expires_at)}</td>
                  <td>
                    {#if g.active}
                      <a class="open-link" href={gateAccessUrl(g.id)}>Browse &amp; download</a>
                    {:else}
                      <span class="muted">-</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</section>

<style>
  /* the nav is fixed (upstream) and about 110px tall: start the page below it */
  .portal { max-width: 1000px; margin: 0 auto; padding: 80px 20px 64px; }
  .portal-head h1 { margin: 0 0 6px; font-size: 32px; font-weight: 700; color: var(--heading); }
  .muted { color: var(--text-muted); }
  /* panel titles: upstream's guide-section headings (cyan, a light rule) */
  .section-label {
    margin: 0 0 14px; padding-bottom: 10px; border-bottom: 2px solid var(--accent-tint);
    font-size: 24px; font-weight: 700; color: var(--accent);
  }

  /* quick actions: upstream's cards (white, 8px corners, soft shadow) with a cyan title */
  .quick-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 24px 0; }
  .qa {
    display: flex; flex-direction: column; gap: 4px; text-align: left; text-decoration: none;
    background: var(--surface); border: 0; border-radius: var(--r-lg); box-shadow: var(--shadow-2);
    padding: 20px 22px; color: var(--text); cursor: pointer; font: inherit;
  }
  .qa:hover { box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15); }
  @media (prefers-reduced-motion: no-preference) {
    .qa { transition: box-shadow 0.3s ease, transform 0.3s ease; }
    .qa:hover { transform: translateY(-2px); }
  }
  .qa:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
  .qa-title { font-size: 18.72px; font-weight: 700; color: var(--accent); }
  .qa:hover .qa-title { color: var(--accent-hover); }
  .qa-sub { color: var(--text-muted); font-size: 14px; }

  .stat-row { display: flex; gap: 24px; margin: 8px 0 4px; flex-wrap: wrap; }
  .stat { color: var(--text-muted); }
  .stat-n { font-size: 24px; font-weight: 700; color: var(--heading); margin-right: 4px; }

  /* panels: upstream's guide sections */
  .panel { background: var(--surface); border-radius: var(--r-lg); box-shadow: var(--shadow-2); padding: 30px; margin-top: 24px; }
  .table-scroll { overflow-x: auto; }
  /* tables: upstream's (cyan header, 12px cells, grey rules) */
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-weight: 700; color: var(--on-accent); background: var(--accent); padding: 12px; white-space: nowrap; }
  td { padding: 12px; border-bottom: 1px solid var(--border); }
  tbody tr:hover { background: var(--hover); --link: var(--accent-hover); }
  .mono { font-variant-numeric: tabular-nums; }
  .empty { color: var(--text-muted); padding: 14px 0; }
  .open-link { font-weight: 600; color: var(--link); white-space: nowrap; text-underline-offset: 2px; }
  .open-link:hover { color: var(--accent-hover); }

  /* status labels: small rounded tags on a tinted ground; the words say the state */
  .pill {
    display: inline-block; font-size: 14px; font-weight: 600; text-transform: capitalize;
    padding: 2px 8px; border-radius: var(--r); background: var(--hover); color: var(--text-soft);
  }
  .pill--approved { background: var(--ok-tint); color: var(--ok); }
  .pill--pending { background: var(--wait-tint); color: var(--wait); }
  .pill--denied { background: var(--danger-tint); color: var(--danger-hover); }
</style>
