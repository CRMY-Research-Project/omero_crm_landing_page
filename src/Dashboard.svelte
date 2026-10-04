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
    <p class="eyebrow">My Portal</p>
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
    <p class="empty">Loading your portal…</p>
  {:else}
    <div class="stat-row">
      <div class="stat"><span class="stat-n">{pendingRequests}</span> pending {pendingRequests === 1 ? "request" : "requests"}</div>
      <div class="stat"><span class="stat-n">{activeGrants}</span> active {activeGrants === 1 ? "grant" : "grants"}</div>
    </div>

    <div class="panel">
      <h2 class="section-label">My access requests</h2>
      {#if requests.length === 0}
        <p class="empty">No requests yet — submit one from “Request access”.</p>
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
                  <td class="mono">{r.expires_at ? formatExpiry(r.expires_at) : "—"}</td>
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
                      <a class="open-link" href={gateAccessUrl(g.id)}>Browse &amp; download&nbsp;&rarr;</a>
                    {:else}
                      <span class="muted">&mdash;</span>
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
  .portal {
    max-width: 1000px;
    margin: 0 auto;
    padding: 32px 20px 64px;
  }
  .eyebrow {
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.72rem;
    color: var(--brass);
    margin: 0 0 4px;
  }
  .portal-head h1 {
    font-family: var(--font-display);
    font-weight: 600;
    margin: 0 0 6px;
    font-size: 2rem;
    color: var(--ink);
  }
  .muted {
    color: var(--ink-soft);
  }
  .section-label {
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.72rem;
    color: var(--ink-soft);
    margin: 0 0 12px;
    font-weight: 600;
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin: 24px 0;
  }
  .qa {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
    text-decoration: none;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 16px 18px;
    color: var(--ink);
    cursor: pointer;
    font: inherit;
    position: relative;
    overflow: hidden;
  }
  .qa::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--brass);
    transform: scaleY(0);
    transform-origin: top;
  }
  @media (prefers-reduced-motion: no-preference) {
    .qa {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .qa::before {
      transition: transform 0.2s ease;
    }
  }
  .qa:hover {
    box-shadow: 0 12px 34px -20px rgba(16, 26, 30, 0.55);
    transform: translateY(-2px);
  }
  .qa:hover::before {
    transform: scaleY(1);
  }
  .qa:focus-visible {
    outline: 2px solid var(--brass);
    outline-offset: 2px;
  }
  .qa-title {
    font-weight: 700;
  }
  .qa-sub {
    color: var(--ink-soft);
    font-size: 0.85rem;
  }

  .stat-row {
    display: flex;
    gap: 24px;
    margin: 8px 0 4px;
    flex-wrap: wrap;
  }
  .stat {
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .stat-n {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--ink);
    margin-right: 4px;
  }

  .panel {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 20px;
    margin-top: 20px;
  }
  .table-scroll {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th {
    text-align: left;
    font-family: var(--font-mono);
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--ink-soft);
    padding: 8px 12px;
    border-bottom: 1px solid var(--line-strong);
    background: var(--surface-2);
    white-space: nowrap;
  }
  td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--line);
  }
  .mono {
    font-family: var(--font-mono);
    font-size: 0.86rem;
  }
  .empty {
    color: var(--ink-soft);
    padding: 14px 0;
  }
  .open-link {
    font-weight: 600;
    color: var(--brass);
    text-decoration: none;
    white-space: nowrap;
    background-image: linear-gradient(currentColor, currentColor);
    background-size: 0 1px;
    background-position: 0 100%;
    background-repeat: no-repeat;
  }
  @media (prefers-reduced-motion: no-preference) {
    .open-link {
      transition: background-size 0.2s ease;
    }
  }
  .open-link:hover,
  .open-link:focus-visible {
    background-size: 100% 1px;
  }

  /* Status pill — the "specimen label": sharp corner + left colour bar. */
  .pill {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 8px 2px 6px;
    border-radius: 2px;
    border-left: 3px solid var(--line-strong);
    background: var(--surface-2);
    color: var(--ink);
  }
  .pill--approved {
    background: var(--brass-tint);
    border-left-color: var(--brass);
  }
  .pill--pending {
    background: var(--ochre-tint);
    border-left-color: var(--ochre);
  }
  .pill--denied {
    background: var(--mulberry-tint);
    border-left-color: var(--mulberry);
  }
</style>
