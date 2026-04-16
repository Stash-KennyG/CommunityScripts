(() => {
  "use strict";

  const PLUGIN_ID = "TimestampSyncButton";
  const TASK_NAME = "Sync Scene";
  const BUTTON_CLASS = "tsb-sync-button";
  const POLL_MS = 700;
  const eligibilityCache = new Map();

  function getSceneId() {
    const match = window.location.pathname.match(/\/scenes\/(\d+)/);
    return match ? match[1] : null;
  }

  async function runSync(sceneId, button) {
    if (!sceneId || !button) return;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Syncing...";
    try {
      const res = await fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query:
            "mutation RunTimestampSync($plugin_id: ID!, $args: Map!) { runPluginOperation(plugin_id: $plugin_id, args: $args) }",
          variables: {
            plugin_id: PLUGIN_ID,
            args: { mode: "processScene", scene_id: sceneId },
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || json.errors) {
        throw new Error(
          (json.errors && json.errors[0] && json.errors[0].message) ||
            "Failed to run task"
        );
      }
      button.textContent = "Queued";
      window.setTimeout(() => {
        button.textContent = originalText;
      }, 1200);
    } catch (err) {
      console.error("[TimestampSyncButton] Failed to run sync task", err);
      button.textContent = "Error";
      window.setTimeout(() => {
        button.textContent = originalText;
      }, 1800);
    } finally {
      window.setTimeout(() => {
        button.disabled = false;
      }, 250);
    }
  }

  async function fetchSceneEligibility(sceneId) {
    if (!sceneId) {
      return { allowed: false, reason: "Missing scene id" };
    }
    if (eligibilityCache.has(sceneId)) {
      return eligibilityCache.get(sceneId);
    }

    try {
      const res = await fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query:
            "query TimestampSyncSceneEligibility($id: ID!) { findScene(id: $id) { id urls stash_ids { endpoint stash_id } } }",
          variables: { id: sceneId },
        }),
      });
      const json = await res.json();
      if (!res.ok || json.errors || !json.data || !json.data.findScene) {
        throw new Error(
          (json.errors && json.errors[0] && json.errors[0].message) ||
            "Failed to load scene"
        );
      }

      const scene = json.data.findScene;
      const hasTsTradeUrl = (scene.urls || []).some((u) =>
        String(u).startsWith("https://timestamp.trade/scene/")
      );
      const hasStashId = Array.isArray(scene.stash_ids) && scene.stash_ids.length > 0;
      const result = hasTsTradeUrl || hasStashId
        ? { allowed: true, reason: "Sync Timestamps from timestamp.trade" }
        : {
            allowed: false,
            reason:
              "Requires a stash_id or a timestamp.trade scene URL to sync",
          };
      eligibilityCache.set(sceneId, result);
      return result;
    } catch (err) {
      console.error("[TimestampSyncButton] Eligibility check failed", err);
      const result = {
        allowed: false,
        reason: "Could not validate scene sync eligibility",
      };
      eligibilityCache.set(sceneId, result);
      return result;
    }
  }

  async function ensureButton(panel) {
    if (!panel) return;
    const createBtn = Array.from(panel.querySelectorAll("button.btn.btn-primary")).find(
      (btn) => (btn.textContent || "").trim() === "Create Marker"
    );
    if (!createBtn) return;

    if (panel.querySelector("." + BUTTON_CLASS)) return;

    const sceneId = getSceneId();
    if (!sceneId) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-primary " + BUTTON_CLASS;
    btn.textContent = "Sync";
    btn.title = "Sync Timestamps from timestamp.trade";
    btn.setAttribute("aria-label", "Sync Timestamps from timestamp.trade");
    btn.disabled = true;
    btn.addEventListener("click", () => runSync(sceneId, btn));
    createBtn.insertAdjacentElement("afterend", btn);

    const eligibility = await fetchSceneEligibility(sceneId);
    btn.disabled = !eligibility.allowed;
    btn.title = eligibility.reason;
    btn.setAttribute("aria-label", eligibility.reason);
  }

  function scan() {
    const activePane = document.querySelector(".tab-content .tab-pane.active.show");
    if (!activePane) return;
    const panel = activePane.querySelector(".scene-markers-panel");
    if (!panel) return;
    ensureButton(panel);
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });
  window.setInterval(scan, POLL_MS);
  scan();
})();
