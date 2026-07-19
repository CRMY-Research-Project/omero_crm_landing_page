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
          placeholder="Project, intended use, approval references…"
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
          {submitting ? "Submitting…" : "Submit request"}
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
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
  }
  .dl-modal {
    background: #fff;
    border-radius: 10px;
    max-width: 520px;
    width: 100%;
    padding: 24px;
    position: relative;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
    max-height: 90vh;
    overflow-y: auto;
  }
  .dl-close {
    position: absolute;
    top: 12px;
    right: 14px;
    background: none;
    border: none;
    font-size: 1.6rem;
    line-height: 1;
    cursor: pointer;
    color: #666;
  }
  .dl-modal h2 {
    margin: 0 0 4px;
    font-size: 1.25rem;
  }
  .dl-sub {
    color: #555;
    font-size: 0.9rem;
    margin: 0 0 16px;
  }
  .dl-target {
    background: #f5f6f8;
    border-radius: 8px;
    padding: 10px 14px;
    margin: 0 0 16px;
  }
  .dl-target div {
    display: flex;
    gap: 8px;
    font-size: 0.9rem;
  }
  .dl-target dt {
    font-weight: 600;
    min-width: 62px;
    margin: 0;
  }
  .dl-target dd {
    margin: 0;
    word-break: break-all;
  }
  .dl-check {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    font-size: 0.88rem;
    margin-bottom: 14px;
    cursor: pointer;
  }
  .dl-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 14px;
  }
  .dl-field span {
    font-weight: 600;
    font-size: 0.88rem;
  }
  .dl-field textarea,
  .dl-field input {
    font: inherit;
    padding: 8px;
    border: 1px solid #c8ccd2;
    border-radius: 6px;
  }
  .dl-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 8px;
  }
  .dl-cancel,
  .dl-submit {
    font: inherit;
    border-radius: 6px;
    padding: 8px 18px;
    cursor: pointer;
    border: none;
  }
  .dl-cancel {
    background: #e7e9ee;
    color: #333;
  }
  .dl-submit {
    background: #2563eb;
    color: #fff;
  }
  .dl-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .dl-message {
    margin: 14px 0 0;
    padding: 10px 12px;
    border-radius: 6px;
    font-size: 0.9rem;
  }
  .dl-message.ok {
    background: #e7f6ec;
    color: #14532d;
  }
  .dl-message.err {
    background: #fdeaea;
    color: #7f1d1d;
  }
</style>
