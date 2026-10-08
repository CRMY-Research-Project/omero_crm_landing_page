<script lang="ts">
    import DownloadModal from "./DownloadModal.svelte";
    import {
        gateStatusUrl,
        gateDownloadUrl,
        type DownloadStatus,
    } from "./lib/api";

    export let datasetCount: number;
    export let projects: any[];
    export let searchQuery: string;
    export let paginatedDatasets: { items: any[], length: number };
    export let currentPage: number;
    export let datasetsPerPage: number;

    export let changePage: (num: number) => void;
    export let onViewerOpen: (imageId: number, datasetId: number) => void;
    export let onSearchUpdate: (query: string) => void;

    $: hasNextPage = () => currentPage * datasetsPerPage < paginatedDatasets.length;
    $: hasPrevPage = () => currentPage > 1;

    // Per-image download-button state, keyed by image id.
    let downloadState: Record<number, string> = {};
    let modalImage: any = null;

    function openViewer(imageId: number, datasetId: number) {
        onViewerOpen(imageId, datasetId); // Call the parent-provided callback
    }

    // Lazy: only ask the gate when the user actually clicks Download.
    async function handleDownload(image: any) {
        downloadState = { ...downloadState, [image.id]: "checking" };
        try {
            const res = await fetch(gateStatusUrl(image.id), {
                headers: { Accept: "application/json" },
            });
            // Public (not-logged-in) users are blocked from the gate URL
            // by OMERO's public url_filter -> non-JSON / redirect.
            const data: DownloadStatus = await res.json().catch(() => null as any);
            if (!res.ok || !data || data.success === false) {
                downloadState = { ...downloadState, [image.id]: "login" };
                return;
            }
            if (data.can_download) {
                // approved / owner / admin -> stream the original file
                window.location.assign(gateDownloadUrl(image.id));
                downloadState = { ...downloadState, [image.id]: "idle" };
            } else if (data.has_pending_request) {
                downloadState = { ...downloadState, [image.id]: "pending" };
            } else {
                modalImage = image; // open request modal
                downloadState = { ...downloadState, [image.id]: "idle" };
            }
        } catch (e) {
            downloadState = { ...downloadState, [image.id]: "login" };
        }
    }

    function handleSearchChange(e: Event) {
        const value = (e.target as HTMLInputElement).value;
        onSearchUpdate(value); // Call the parent-provided callback
    }

    function clearSearch() {
        onSearchUpdate(""); // Clear the search query
    }
</script>

<main class="patient-data">
    <h3>Total Patients: {datasetCount}</h3>

    {#if projects.length > 0}
      <div class="search-container">
        <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search patients..."
            class="search-bar"
            on:input={handleSearchChange}
        />

        {#if searchQuery}
            <button class="clear-search" on:click|preventDefault={clearSearch}>
                &times;
            </button>
        {/if}
      </div>

        {#if paginatedDatasets.length === 0}
          <div class="search-results-msg">
            <p>No images found matching "{searchQuery}"</p>
          </div>
        {:else}
        <table class="omero-table">
            <thead>
                <tr>
                    <th>Image Preview</th>
                    <th>Image Name</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each paginatedDatasets.items as image}
                    <tr>
                        <td>
                            <img
                                src={image.src}
                                alt="Thumbnail of {image.imageName}"
                                width="100"
                            />
                        </td>
                        <td>
                           <a href={window.location.origin + `/webclient/?show=image-${image.id}`}>{image.imageName}</a>
                        </td>
                        <td class="viewer-actions">
                            <button
                                on:click|preventDefault={() => openViewer(image.id, image.datasetId)}
                                class="viewer-btn"
                            >
                                Quick View
                            </button>
                            {#if downloadState[image.id] === "pending"}
                                <span class="dl-status pending" title="An administrator is reviewing your request">
                                    Request pending
                                </span>
                            {:else if downloadState[image.id] === "login"}
                                <a class="download-btn" href={window.location.origin + "/webclient/login/"}>
                                    Log in to download
                                </a>
                            {:else}
                                <button
                                    class="download-btn"
                                    on:click|preventDefault={() => handleDownload(image)}
                                    disabled={downloadState[image.id] === "checking"}
                                >
                                    {downloadState[image.id] === "checking" ? "Checking..." : "Download"}
                                </button>
                            {/if}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>

        <!-- Pagination Controls -->
        <div class="pagination-controls">
          <button on:click={() => changePage(currentPage - 1)} disabled={!hasPrevPage()}>
            Previous
          </button>
          <span>Page {currentPage}</span>
          <button on:click={() => changePage(currentPage + 1)} disabled={!hasNextPage()}>
            Next
          </button>
        </div>
      {/if}
    {:else}
        <p>Loading projects...</p>
    {/if}
</main>

{#if modalImage}
    <DownloadModal image={modalImage} onClose={() => (modalImage = null)} />
{/if}

<style>
    .download-btn {
        display: inline-block; margin-left: 8px; padding: 8px 12px;
        font-family: inherit; font-size: 13.333px; font-weight: bold;   /* upstream's Quick View size */
        border: 1px solid var(--accent); background: var(--surface); color: var(--accent);
        border-radius: 5px; cursor: pointer; text-decoration: none;
    }
    .download-btn:hover { background: var(--accent); color: var(--on-accent); }
    .download-btn:disabled { cursor: not-allowed; background: var(--border-strong); border-color: var(--border-strong); color: #555555; }
    .dl-status.pending {
        display: inline-block; margin-left: 8px; padding: 6px 12px; font-size: 14px; font-weight: 600;
        color: var(--wait); background: var(--wait-tint); border-radius: 5px;
    }
</style>
