<script context="module" lang="ts">
  export type Route = "home" | "help" | "portal";
</script>

<script lang="ts">
  import "./app.css";
  import logo from "./assets/logo.png";
  import { onMount, onDestroy } from "svelte";
  import Home from "./Home.svelte";
  import Help from "./Guide.svelte";
  import Dashboard from "./Dashboard.svelte";
  import {
    searchUrl,
    toTableRow,
    debounce,
    portalSummaryUrl,
    type SearchResponse,
    type PortalSummary,
  } from "./lib/api";

  // NFR2: only routes with real content — empty "about"/"donate" pages removed
  const routes: { name: Route; label: string }[] = [
    { name: "home", label: "Home" },
    { name: "help", label: "Help" },
  ];

  let currentRoute: Route = "home";

  function isActive(route: Route) {
    return currentRoute === route;
  }

  function handleRouteChange(path: string) {
    const route = (path || "").replace("/", "") as Route;
    const valid = route === "portal" || routes.some((r) => r.name === route);
    currentRoute = valid ? route : "home";
  }

  // Unified-shell auth state (WS-G): distinguishes a real researcher login from
  // the anonymous public browsing session so the shell shows the right actions.
  let summary: PortalSummary | null = null;
  async function loadSummary() {
    try {
      const res = await fetch(portalSummaryUrl());
      if (res.ok) summary = await res.json();
    } catch {
      /* stay in guest mode if the summary can't be loaded */
    }
  }

  // Reactive variables
  let datasetCount = 0;
  let projects: { id: number; name: string; description: string }[] = [];
  let searchQuery = "";

  let currentPage = 1; // Pagination state
  const datasetsPerPage = 5;

  let paginatedDatasets: { items: any[]; length: number } = {
    items: [],
    length: 0,
  };

  // Server-side search (TC-05): one request per page instead of
  // fetching every project/dataset/image up front.
  async function runSearch() {
    try {
      const response = await fetch(
        searchUrl(searchQuery, currentPage, datasetsPerPage)
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: SearchResponse = await response.json();
      paginatedDatasets = {
        items: data.items.map(toTableRow),
        length: data.total,
      };
      datasetCount = data.dataset_count;
      projects = data.projects;
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  }

  const debouncedSearch = debounce(runSearch, 300);

  function changePage(newPage: number) {
    currentPage = newPage; // Update the current page
    runSearch();
  }

  function navigate(route: Route) {
    currentRoute = route;
    window.scrollTo(0, 0);
  }

  onMount(() => {
    handleRouteChange(window.location.pathname);

    window.onpopstate = (event) => {
      handleRouteChange(event.state?.route);
    };

    runSearch();
    loadSummary();
  });

  function getViewerUrl(imageId: number, datasetId: number) {
    return (
      window.location.origin +
      `/webclient/img_detail/${imageId}/?dataset=${datasetId}`
    );
  }

  onDestroy(() => {
    window.onpopstate = null;
  });
</script>

<nav>
  <div class="nav-container">
    <img src={logo} alt="Cancer Research Malaysia logo" class="logo" />
    <div class="nav-right">
      <ul class="nav-links">
        {#each routes as route}
          <li class:active={isActive(route.name)}>
            <button type="button" on:click={() => navigate(route.name)}>
              <span>{route.label}</span>
            </button>
          </li>
        {/each}
        {#if summary && summary.authenticated}
          <li class:active={isActive("portal")}>
            <button type="button" on:click={() => navigate("portal")}>
              <span>My Portal</span>
            </button>
          </li>
        {/if}
      </ul>
      <div class="shell-auth">
        {#if summary && summary.authenticated}
          <span class="shell-user" title={summary.username}>
            {summary.full_name || summary.username}
          </span>
          <a class="shell-btn" href={summary.logout_url}>Log out</a>
        {:else if summary}
          <a class="shell-btn" href={summary.login_url}>Log in</a>
        {/if}
      </div>
    </div>
  </div>
</nav>

<div class="page-container">
  {#if currentRoute === "home"}
    <Home
      {datasetCount}
      {projects}
      {searchQuery}
      {paginatedDatasets}
      {currentPage}
      {datasetsPerPage}
      {getViewerUrl}
      {changePage}
      onSearchUpdate={(search) => {
        searchQuery = search;
        currentPage = 1;
        debouncedSearch();
      }}
    />
  {:else if currentRoute === "help"}
    <Help />
  {:else if currentRoute === "portal"}
    <Dashboard {summary} onBrowse={() => navigate("home")} />
  {/if}
</div>

<footer class="site-footer">
  <div class="footer-container">
    <div class="footer-section">
      <h3>Get in Touch</h3>
      <p>Cancer Research Malaysia <span>200001007481 (510087-M)</span></p>
      <p>+603 5650 9797 (9am – 5pm)</p>
      <p>
        Level 1, Subang Jaya Medical Centre South Tower, No. 1, Jalan SS 12/1A,
        47500 Subang Jaya, Selangor Darul Ehsan.
      </p>
    </div>

    <div class="footer-section">
      <h3>Explore</h3>
      <ul>
        {#each routes as route}
          <li class:active={isActive(route.name)}>
            <button type="button" on:click={() => navigate(route.name)}>
              {route.label}
            </button>
          </li>
        {/each}
      </ul>
    </div>

    <div class="footer-section">
      <h3>Follow Us</h3>
      <!-- Inline SVG brand glyphs (self-hosted, no Font Awesome CDN). -->
      <div class="social-icons">
        <a
          href="https://twitter.com/CancerResearchM"
          target="_blank"
          rel="noopener"
          aria-label="Cancer Research Malaysia on X (Twitter)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
        <a
          href="https://www.facebook.com/CancerResearchMY"
          target="_blank"
          rel="noopener"
          aria-label="Cancer Research Malaysia on Facebook"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </a>
        <a
          href="https://www.instagram.com/cancerresearchmy"
          target="_blank"
          rel="noopener"
          aria-label="Cancer Research Malaysia on Instagram"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.163c3.204 0 3.584.012 4.849.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.849.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        </a>
      </div>
    </div>
  </div>

  <div class="footer-bottom">
    <p>
      &copy; {new Date().getFullYear()} Cancer Research Malaysia. All rights reserved.
    </p>
  </div>
</footer>

<style>
  .nav-right {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .shell-auth {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .shell-user {
    font-size: 14px;
    font-weight: 600;
    color: var(--ink-soft);
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .shell-btn {
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    color: var(--paper);
    background: var(--brass);
    padding: 7px 14px;
    border-radius: 6px;
    transition: background 0.2s ease;
  }
  .shell-btn:hover {
    background: var(--brass-deep);
  }
  .social-icons a :global(svg) {
    width: 26px;
    height: 26px;
    display: block;
  }
  @media (max-width: 768px) {
    .nav-right {
      gap: 12px;
    }
    .shell-user {
      display: none;
    }
  }
</style>
