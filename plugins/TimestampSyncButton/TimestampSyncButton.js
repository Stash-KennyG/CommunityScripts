(() => {
  "use strict";

  const PLUGIN_ID = "TimestampSyncButton";
  const TASK_NAME = "Sync Scene";
  const BUTTON_CLASS = "tsb-sync-button";
  const POLL_MS = 700;
  const eligibilityCache = new Map();

  async function logToStash(level, message, sceneId) {
    if (!message) return;
    try {
      await fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query:
            "mutation TimestampSyncClientLog($plugin_id: ID!, $args: Map!) { runPluginOperation(plugin_id: $plugin_id, args: $args) }",
          variables: {
            plugin_id: PLUGIN_ID,
            args: {
              mode: "clientLog",
              level: level || "info",
              scene_id: sceneId || "",
              message:
                (sceneId ? `[scene:${sceneId}] ` : "") + String(message),
            },
          },
        }),
      });
    } catch (_) {
      // Do not recurse logging failures.
    }
  }

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
      const operationQuery =
        "mutation RunTimestampSync($plugin_id: ID!, $args: Map!) { runPluginOperation(plugin_id: $plugin_id, args: $args) }";
      const operationVars = {
        plugin_id: PLUGIN_ID,
        args: { mode: "processScene", scene_id: sceneId },
      };

      const taskQuery =
        "mutation RunTimestampSyncTask($sceneId: ID!) { runPluginTask(plugin_id: \"TimestampSyncButton\", task_name: \"Sync Scene\", args: { scene_id: $sceneId }) }";
      const taskVars = { sceneId: sceneId };

      async function callGraphQL(query, variables) {
        const res = await fetch("/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, variables }),
        });
        let json = null;
        try {
          json = await res.json();
        } catch (_) {
          json = null;
        }
        if (!res.ok || (json && json.errors)) {
          const msg =
            (json &&
              json.errors &&
              json.errors[0] &&
              json.errors[0].message) ||
            `HTTP ${res.status}`;
          throw new Error(msg);
        }
        return json;
      }

      try {
        await callGraphQL(operationQuery, operationVars);
      } catch (opErr) {
        await callGraphQL(taskQuery, taskVars);
      }

      button.textContent = "Synced";
      button.title = "Sync completed; refreshing page";
      window.setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      const msg =
        "[TimestampSyncButton] Failed to queue sync task: " +
        (err && err.message ? err.message : String(err));
      console.error(msg);
      logToStash("error", msg, sceneId);
      button.textContent = "Error";
      button.title = msg;
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
      const msg =
        "[TimestampSyncButton] Eligibility check failed: " +
        (err && err.message ? err.message : String(err));
      console.error(msg);
      logToStash("error", msg, sceneId);
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
