(() => {
  "use strict";

  const PLUGIN_CLASS = "cpir-resolution";
  const MODAL_SELECTOR = ".modal-dialog, .Modal-dialog";
  const WATCH_MS = 250;
  const states = new WeakMap();

  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }

  function hasCreatePerformerText(modal) {
    const text = (modal.textContent || "").toLowerCase();
    return text.includes("create performer") && text.includes("select performer image");
  }

  function findLabel(modal) {
    const nodes = modal.querySelectorAll("div, span, p");
    for (const node of nodes) {
      const text = (node.textContent || "").trim().toLowerCase();
      if (text.includes("select performer image")) return node;
    }
    return null;
  }

  function findPrimaryImage(modal) {
    const images = Array.from(modal.querySelectorAll("img"));
    const candidates = images.filter((img) => {
      if (!isVisible(img)) return false;
      const rect = img.getBoundingClientRect();
      return rect.width >= 120 && rect.height >= 120;
    });

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height);
    return candidates[0];
  }

  function ensureResolutionNode(state, labelNode) {
    if (state.resolutionNode && state.resolutionNode.isConnected) return state.resolutionNode;

    const resolution = document.createElement("div");
    resolution.className = PLUGIN_CLASS;

    // Inherit native typography classnames from the label when possible.
    if (labelNode && labelNode.classList.length) {
      labelNode.classList.forEach((cls) => resolution.classList.add(cls));
    }

    labelNode.insertAdjacentElement("afterend", resolution);
    state.resolutionNode = resolution;
    return resolution;
  }

  function updateResolution(state) {
    if (!state.modal.isConnected) return;
    const labelNode = findLabel(state.modal);
    if (!labelNode) return;

    const image = findPrimaryImage(state.modal);
    const resolutionNode = ensureResolutionNode(state, labelNode);
    if (!image) {
      resolutionNode.textContent = "";
      return;
    }

    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      resolutionNode.textContent = `${image.naturalWidth} x ${image.naturalHeight}`;
    } else {
      resolutionNode.textContent = "";
    }
  }

  function wireModal(modal) {
    if (states.has(modal)) return;
    const state = {
      modal,
      resolutionNode: null,
      intervalId: null,
    };

    state.intervalId = window.setInterval(() => {
      if (!modal.isConnected) {
        window.clearInterval(state.intervalId);
        return;
      }
      updateResolution(state);
    }, WATCH_MS);

    states.set(modal, state);
    updateResolution(state);
  }

  function scan() {
    const modals = document.querySelectorAll(MODAL_SELECTOR);
    for (const modal of modals) {
      if (!isVisible(modal)) continue;
      if (!hasCreatePerformerText(modal)) continue;
      wireModal(modal);
    }
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });
  scan();
})();
