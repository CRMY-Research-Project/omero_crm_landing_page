<script lang="ts">
  import { onMount } from "svelte";
  import crm1 from "./assets/crm1.png";
  import crm2 from "./assets/crm2.png";
  import crm3 from "./assets/crm3.png";
  import crm4 from "./assets/crm4.png";
  import crm5 from "./assets/crm5.png";
  import crm6 from "./assets/crm6.png";
  import crm7 from "./assets/crm7.png";
  import crm8 from "./assets/crm8.png";
  import crm9 from "./assets/crm9.png";
  import crm10 from "./assets/crm10.png";
  import crm11 from "./assets/crm11.png";
  import crm12 from "./assets/crm12.png";

  let sectionRefs: Record<string, HTMLElement> = {};
  let activeSection: string = "";

  function scrollToSection(id: string) {
    const section = sectionRefs[id];
    if (section) {
      setTimeout(() => section.scrollIntoView({ behavior: "smooth" }), 10);
    }
  }

  function handleScrollToSection(id: string) {
    scrollToSection(id);
  }

  const sections = [
    {
      id: "browsing",
      title: "Browsing Images",
      steps: [
        {
          stepNumber: 1,
          content: `
          <p>On the homepage, the table provided contains images alongside their respective names and a button for quick viewing.</p>
        `,
        },
        {
          stepNumber: 2,
          content: `
          <p>Navigate through the pages of the table using the 'Previous' and 'Next' buttons located at the bottom.</p>
        `,
          imageSrc: crm1,
          altText: "Browsing Images",
        },
      ],
    },
    {
      id: "searching",
      title: "Searching Images",
      message:
        "You can search for specific images using the search bar at the top of the table",
      steps: [
        {
          stepNumber: 1,
          content: `
          <p>Type any keyword associated with the image name in the search box to search for relevant images.</p>
        `,
        },
        {
          stepNumber: 2,
          content: `
          <p>The search results will dynamically update as you type. If you wish to clear your search, click the 'x' icon.</p>
        `,
          imageSrc: crm2,
          altText: "Search Images",
        },
      ],
    },
    {
      id: "viewing",
      title: "Viewing Images",
      message: "View image in the interactive OMERO iViewer",
      steps: [
        {
          stepNumber: 1,
          content: `
          <p>To access a quick view of the image, click the 'Quick View' button in the same row as the image thumbnail.</p>
        `,
          imageSrc: crm3,
          altText: "Quick View button",
        },
        {
          stepNumber: 2,
          content: `
          <p>The OMERO iViewer for the selected image will open below the table. <b>You can:</b></p>
          <ul>
            <li>Zoom in and out of the image by using the + and - buttons in the top-left corner or by scrolling the mouse wheel.</li>
            <li>Rotate the image by holding Shift on your keyboard and then drag the image using the mouse.</li>
            <li>View metadata in the right panel.</li>
          </ul>
          <p>For more information about OMERO iViewer, refer to the <a href="https://omero-guides.readthedocs.io/en/latest/iviewer/docs/iviewer_viewing.html" target="_blank">OMERO documentation</a>.</p>
        `,
          imageSrc: crm4,
          altText: "Image viewer",
        },
      ],
    },
    {
      id: "downloading",
      title: "Downloading Images",
      steps: [
        {
          stepNumber: 1,
          content: `
          <p>First, open the image in the OMERO iViewer and click the "Open in
            OMERO" button located at the top-right corner to open up OMERO web.</p>
        `,
        },
        {
          stepNumber: 2,
          content: `
          <p>In OMERO main user interface, select one or more images you want to
            download. Then, find in the top of the right-hand pane the download
            icon, click on it and select the desired action, for example
            Download, which downloads the data in original format.</p>
        `,
          imageSrc: crm5,
          altText: "Download options",
        },
      ],
    },
    {
      id: "OMERO UI",
      title: "Using OMERO Web",
      steps: [
        {
          stepNumber: 1,
          content: `
          <p>The OMERO main user interface shows your data tree in the left-hand panel.
             When data is selected in the tree, the thumbnails are displayed in the center panel, 
             and the metadata and other information in the right-hand panel.</p>
        `,
          imageSrc: crm6,
          altText: "OMERO interface",
        },
        {
          stepNumber: 2,
          content: `
          <p>To view an image in the Image Viewer, select the image in the data tree and click on the 'Full Viewer' button.<br><br>
          or double click on the image or thumbnail.</p>
        `,
          imageSrc: crm12,
          altText: "View image in OMERO iViewer",
        },
      ],
    },
    {
      id: "OMERO General",
      title: "OMERO Web - General",
      message: "Edit Image Name and Image Description",
      steps: [
        {
          stepNumber: 1,
          content: `
          <p>In the General tab of the right-hand panel, click on the pencil icon to edit the image name or image description.
            Summary details of the image can be seen below the description.</p>
        `,
          imageSrc: crm7,
          altText: "OMERO web general tab",
        },
      ],
    },
    {
      id: "OMERO Group",
      title: "OMERO Web - Grouping",
      message: "Data Management",
      steps: [
        {
          stepNumber: 1,
          content: `
          <p>If you belong to more than one group, you can interact with the data of other users in your group.<br><br>
          Click on the drop-down arrow to the right of your name in the bar above the data tree, and select a group and user,
          or All members to see all the data in the group.<br><br>
          For details of how to share data using OMERO see the <a
                  href="https://omero-guides.readthedocs.io/en/latest/introduction/docs/data-management.html"
                  target="_blank">Sharing Data workflow section</a
          ></p>
        `,
          imageSrc: crm11,
          altText: "grouping",
        },
      ],
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      steps: [
        {
          stepNumber: 1,
          content: `
          <h3>Need further assistance? <br>Contact our support team at <a href="mailto:info@cancerresearch.my">info@cancerresearch.my</a></h3>
        `,
        },
        {
          stepNumber: 2,
          content: `
          <h3>For more information about OMERO web, refer to the <a
                  href="https://help.glencoesoftware.com/omero-plus/5.2/web-client.html"
                  target="_blank">OMERO Quickstart User Guides</a
                ></h3>
        `,
        },
      ],
    },
  ];

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          activeSection = visible[0].target.getAttribute("data-section") || "";
        }
      },
      { threshold: 0.2, rootMargin: "-150px 0px -40px 0px" }
    );

    Object.values(sectionRefs).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  });
</script>

<div class="guide-container">
  <nav class="guide-nav">
    <h3>Contents</h3>
    <ul>
      {#each sections as { id, title }}
        <li>
          <a
            href={"#" + id}
            class:selected={activeSection === id}
            on:click|preventDefault={() => handleScrollToSection(id)}
          >
            {title}
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="guide-content">
    <section class="guide-section">
      <h2>Cancer Dataset Portal Guide</h2>
      <h3>
        This guide will help you navigate and utilize all the features of the
        portal.
      </h3>
    </section>

    {#each sections as section (section.id)}
      <section
        id={section.id}
        class="guide-section"
        bind:this={sectionRefs[section.id]}
        data-section={section.id}
      >
        <h2>{section.title}</h2>
        {#if section.message}
          <h3>{section.message}</h3>
        {/if}
        {#each section.steps as step}
          <div class="step">
            <div class="step-number">{step.stepNumber}</div>
            <div class="step-content">
              <p>{@html step.content}</p>
              {#if step.imageSrc}
                <img
                  src={step.imageSrc}
                  alt={step.altText}
                  class="screenshot"
                />
              {/if}
            </div>
          </div>
        {/each}
        {#if section.id === "viewing"}
          <h3>View image in the OMERO main user interface</h3>
        {/if}
        {#if section.id === "OMERO General"}
          <h3>Share Images</h3>
        {/if}
        {#if section.id === "viewing"}
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <p>
                Click the 'Open in OMERO' button located at the top-right corner
                of OMERO iViewer to open up OMERO web in order to explore more
                advanced viewing features in the OMERO main user interface.
              </p>
            </div>
          </div>
        {/if}
        {#if section.id === "OMERO General"}
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <p>
                Click on the 'link' button to generate a URL to share the image.
              </p>
              <img
                src={crm8}
                alt="link button in OMERO Web"
                class="screenshot"
              />
            </div>
          </div>
        {/if}
        {#if section.id === "OMERO General"}
          <h3>Annotating Data</h3>
        {/if}
        {#if section.id === "OMERO General"}
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <p>
                Use the Annotations section to add a rating, tag, or attachment
                to a Project, Dataset or image.
              </p>
              <p>
                For more information, refer to the <a
                  href="https://omero-guides.readthedocs.io/en/latest/introduction/docs/index.html"
                  target="_blank">Managing Data</a
                > Documentation
              </p>
              <img src={crm9} alt="Annotations Section" class="screenshot" />
            </div>
          </div>
        {/if}
        {#if section.id === "OMERO General"}
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <p>
                Key-Value pairs and comments can also be added as annotations.
              </p>
              <img src={crm10} alt="Key-Value pairs" class="screenshot" />
            </div>
          </div>
        {/if}
        {#if section.id === "downloading"}
          <div class="note">
            <strong>Note:</strong> Some images are very large (several GB). Ensure
            you have sufficient storage space and a stable internet connection before
            downloading.
          </div>
        {/if}
      </section>
    {/each}
  </div>
</div>
