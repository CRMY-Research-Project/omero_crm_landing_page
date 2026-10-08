<script lang="ts">
  import { gateRequestUrl, getCookie } from "./lib/api";

  // The image the user asked to download, plus its parent dataset.
  export let image: {
    id: number;
    imageName: string;
    datasetId: number;
    datasetName: string;
  };
  export let onClose: () => void;

  let reason = "";
  let requestWholeDataset = false;
  let files: FileList | null = null;
  let submitting = false;
  let message = "";
  let messageKind: "ok" | "err" | "" = "";

  async function submit() {
    submitting = true;
    message = "";
    messageKind = "";
    try {
      const form = new FormData();
      form.append(
        "target_type",
        requestWholeDataset ? "dataset" : "image"
      );
      form.append(
        "target_id",
        String(requestWholeDataset ? image.datasetId : image.id)
      );
      form.append("reason", reason);
      if (files) {
        Array.from(files).forEach((f, i) => form.append(`doc${i}`, f));
      }

      const res = await fetch(gateRequestUrl(), {
        method: "POST",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(
          data?.error?.message || `Request failed (HTTP ${res.status})`
        );
      }
      message =
        "Request submitted. An administrator will review it and you'll " +
        "be able to download once approved.";
      messageKind = "ok";
    } catch (e) {
      message = e instanceof Error ? e.message : "Request failed";
      messageKind = "err";
    } finally {
      submitting = false;
    }
  }
</script>

<!-- backdrop -->
<div
  class="dl-backdrop"
  on:click|self={onClose}
  on:keydown={(e) => e.key === "Escape" && onClose()}
  role="dialog"
  aria-modal="true"
  aria-labelledby="dl-modal-title"
  tabindex="-1"
>
  <div class="dl-modal">
    <button class="dl-close" on:click={onClose} aria-label="Close">
      &times;
    </button>
    <h2 id="dl-modal-title">Request download access</h2>
    <p class="dl-sub">
      Downloads of dataset images require administrator approval. Submit
      the required documents (e.g. ethics approval, project proposal).
    </p>

    <dl class="dl-target">
      <div><dt>Image</dt><dd>{image.imageName}</dd></div>
      <div><dt>Dataset</dt><dd>{image.datasetName} (#{image.datasetId})</dd></div>
    </dl>

    {#if messageKind !== "ok"}
      <label class="dl-check">
        <input type="checkbox" bind:checked={requestWholeDataset} />
        Request access to the whole dataset (all its images), not just this image
      </label>

      <label class="dl-field">
        <span>Reason for access</span>
        <textarea
          bind:value={reason}
          rows="3"
          placeholder="Project, intended use, approval references..."
        ></textarea>
      </label>

      <label class="dl-field">
        <span>Supporting documents (pdf, doc, docx, txt, png, jpg)</span>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          on:change={(e) => (files = (e.target as HTMLInputElement).files)}
        />
      </label>

      <div class="dl-actions">
        <button class="dl-cancel" on:click={onClose}>Cancel</button>
        <button class="dl-submit" on:click={submit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit request"}
        </button>
      </div>
    {/if}

    {#if message}
      <p class="dl-message {messageKind}">{message}</p>
    {/if}
    {#if messageKind === "ok"}
      <div class="dl-actions">
        <button class="dl-submit" on:click={onClose}>Done</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .dl-backdrop {
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
    display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;
  }
  /* upstream's cards: white, 8px corners, soft shadow, 30px padding */
  .dl-modal {
    background: var(--surface); border-radius: var(--r-lg); box-shadow: var(--shadow-2);
    max-width: 540px; width: 100%; padding: 30px; position: relative; max-height: 90vh; overflow-y: auto;
  }
  .dl-close {
    position: absolute; top: 14px; right: 16px; min-width: 32px; min-height: 32px;
    background: none; border: none; border-radius: var(--r); font-size: 1.6rem; line-height: 1;
    cursor: pointer; color: var(--text-muted);
  }
  .dl-close:hover { color: var(--text); background: var(--hover); }
  .dl-modal h2 { margin: 0 0 4px; font-size: 24px; font-weight: 700; color: var(--accent); }
  .dl-sub { color: var(--text-soft); margin: 0 0 16px; }
  /* what is being requested: upstream's note */
  .dl-target {
    background: var(--accent-tint); border-left: 4px solid var(--accent-bright); border-radius: 0 4px 4px 0;
    padding: 12px 15px; margin: 0 0 16px;
  }
  .dl-target div { display: flex; gap: 8px; }
  .dl-target dt { font-weight: 600; min-width: 62px; margin: 0; }
  .dl-target dd { margin: 0; word-break: break-all; }
  .dl-check { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 14px; cursor: pointer; }
  .dl-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
  .dl-field span { font-weight: 600; }
  .dl-field textarea,
  .dl-field input { font: inherit; padding: 8px 12px; border: 1px solid var(--border-strong); border-radius: var(--r); }
  .dl-field textarea:focus-visible,
  .dl-field input:focus-visible { outline: none; border-color: var(--focus); box-shadow: 0 0 5px rgba(0, 123, 255, 0.5); }
  .dl-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
  .dl-cancel,
  .dl-submit { font: inherit; font-weight: 700; border-radius: var(--r); padding: 8px 18px; min-height: 40px; cursor: pointer; }
  .dl-cancel { background: var(--surface); color: var(--text); border: 1px solid var(--border-strong); font-weight: 400; }
  .dl-cancel:hover { background: var(--hover); }
  .dl-submit { background: var(--accent); color: var(--on-accent); border: 1px solid var(--accent); }
  .dl-submit:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); }
  .dl-submit:disabled { cursor: not-allowed; background: var(--border-strong); border-color: var(--border-strong); color: #555555; }
  .dl-message { margin: 14px 0 0; padding: 15px; border-left: 4px solid transparent; border-radius: 0 4px 4px 0; color: var(--text); }
  .dl-message.ok { background: var(--ok-tint); border-left-color: var(--ok-line); }
  .dl-message.err { background: var(--danger-tint); border-left-color: var(--danger); }
</style>
