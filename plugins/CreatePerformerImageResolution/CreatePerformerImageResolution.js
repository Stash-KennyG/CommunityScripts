(() => {
  "use strict";

  const PLUGIN_CLASS = "cpir-resolution";
  const wiredSelections = new WeakSet();

  function formatResolution(img) {
    if (!img) return "";
    const w = Number(img.naturalWidth || 0);
    const h = Number(img.naturalHeight || 0);
    if (!w || !h) return "";
    return `${w} x ${h}`;
  }

  function ensureResolutionNode(imageSelection, label) {
    let node = imageSelection.querySelector("." + PLUGIN_CLASS);
    if (node) return node;

    node = document.createElement("h5");
    node.className = "cpir-resolution";

    // Match the native label typography/spacing as closely as possible.
    if (label && label.classList && label.classList.length) {
      label.classList.forEach((cls) => node.classList.add(cls));
    }

    const controls = imageSelection.querySelector(".d-flex.mt-3");
    if (controls) {
      controls.insertAdjacentElement("afterend", node);
    } else if (label) {
      label.insertAdjacentElement("afterend", node);
    } else {
      imageSelection.appendChild(node);
    }

    return node;
  }

  function refresh(imageSelection) {
    const img = imageSelection.querySelector(".performer-image img");
    const label = imageSelection.querySelector(".d-flex.mt-3 h5.flex-grow-1");
    const node = ensureResolutionNode(imageSelection, label);
    node.textContent = formatResolution(img);
  }

  function wire(imageSelection) {
    if (wiredSelections.has(imageSelection)) return;
    wiredSelections.add(imageSelection);

    const img = imageSelection.querySelector(".performer-image img");
    const controls = imageSelection.querySelector(".d-flex.mt-3");
    const buttons = controls ? controls.querySelectorAll("button") : [];

    if (img) {
      img.addEventListener("load", () => refresh(imageSelection));
    }
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        window.setTimeout(() => refresh(imageSelection), 0);
        window.setTimeout(() => refresh(imageSelection), 120);
      });
    });

    refresh(imageSelection);
  }

  function scan() {
    const selections = document.querySelectorAll(
      ".performer-create-modal .image-selection"
    );
    selections.forEach(wire);
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });
  scan();
})();
