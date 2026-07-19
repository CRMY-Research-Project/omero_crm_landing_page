<script lang="ts">
    import ProjectTable from "./ProjectTable.svelte";
  
    export let datasetCount: number;
    export let projects: any[];
    export let searchQuery: string;
    export let paginatedDatasets: { items: any[], length: number };
    export let currentPage: number;
    export let datasetsPerPage: number;
    export let getViewerUrl: (imageId: number, datasetId: number) => string;
    export let changePage: (num: number) => void;
    export let onSearchUpdate: (search: string) => void;
    
    let viewerContainer: HTMLElement;
    let topAnchor: HTMLElement; 

    let viewerState = {
        isOpen: false,
        imageId: null as number | null,
        datasetId: null as number | null,
        viewerUrl: null as string | null,
    };

    function openViewer(imageId: number, datasetId: number) {
        viewerState = {
            isOpen: true,
            imageId,
            datasetId,
            viewerUrl: getViewerUrl(imageId, datasetId),
        };
      
       setTimeout(() => {
            if (viewerContainer) {
                viewerContainer.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 50); // Small delay to allow DOM update
    
    }

    function closeViewer() {
        viewerState = {
            isOpen: false,
            imageId: null,
            datasetId: null,
            viewerUrl: null,
        };

        setTimeout(() => {
            if (topAnchor) {
                topAnchor.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 50);
    }

    function updateSearch(search: string) {
        searchQuery = search;
        onSearchUpdate(search);
    }
</script>

<div bind:this={topAnchor}></div>

<section class="intro-section">
    <div class="intro-content">
        <h2>Cancer Research Malaysia</h2>
        <h2>Breast Cancer Dataset</h2>
        <p>
            This is a portal to access our Breast Cancer Dataset, with
            Whole-Slide Images of 5 different markers (CD3, CD4, CD8, H&E and
            PDL1) from ~600 patients.
        </p>
        <p>
            Click the "Help" button at the top right for instructions on how to
            use this portal. Otherwise, click on one of the images below to be
            sent to it in the main user interface.
        </p>
    </div>
</section>

<ProjectTable
    {datasetCount}
    {projects}
    {searchQuery}
    {paginatedDatasets}
    {currentPage}
    {datasetsPerPage}
    {changePage}
    onViewerOpen={openViewer}
    onSearchUpdate={q => updateSearch(q)}
/>

<!-- Viewer Modal -->
{#if viewerState.isOpen}
  <div id="omero-viewer-container" style="width: 100%; margin-top: 0px; padding-top: 50px; scroll-margin-top: 50px;" bind:this={viewerContainer}>
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 2rem;">
      <h3>OMERO iviewer</h3>
      <button on:click={closeViewer} class="viewer-btn">Close Viewer</button>
      <a href={window.location.origin + `/webclient/?show=image-${viewerState.imageId}`} 
         target="_blank" 
         rel="noopener noreferrer">
        <button
          class="viewer-btn"
        >
          Open in OMERO
        </button>
      </a>
    </div>
    <iframe
      id="omero-viewer-iframe"
      title="OMERO image viewer"
      src={viewerState.viewerUrl}
      width="100%"
      height="800"
      style="border: 1px solid #ccc; border-radius: 8px;"
      allowfullscreen
    ></iframe>
  </div>
{/if}

<section class="outro-section">
    <div class="outro-columns">
        <div class="outro-column left-column">
            <h1>Every gift matters in the fight against cancer</h1>
        </div>

        <div class="vertical-divider"></div>

        <div class="outro-column right-column">
            <h2>
                Support the essential work of our researchers, so that we
                can provide access to world-class, compassionate care for
                people with cancer.
            </h2>

            <!-- The internal "donate" route was an empty page (NFR2);
                 link to Cancer Research Malaysia's real donation site instead -->
            <button
                class="donate-btn"
                on:click={() =>
                    window.open(
                        "https://www.cancerresearch.my/donate/",
                        "_blank",
                        "noopener"
                    )}
            >
                Donate Now
            </button>
        </div>
    </div>
</section>