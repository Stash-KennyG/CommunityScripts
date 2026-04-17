"use strict";

(function () {
  var PLUGIN_ID = "BetterTagger";
  var DEBOUNCE_MS = 180;
  var SETTINGS_TTL_MS = 30000;

  var FP_CLASS_LIST = [
    "bt-fp-severe",
    "bt-fp-warn",
    "bt-fp-caution",
    "bt-fp-good",
  ];
  var DM_CLASS_LIST = ["bt-dm-strong", "bt-dm-soft"];

  var VERIFIED_SVG =
    '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="bt-verified-svg"><path fill="currentColor" d="M243.8 339.8C232.9 350.7 215.1 350.7 204.2 339.8L140.2 275.8C129.3 264.9 129.3 247.1 140.2 236.2C151.1 225.3 168.9 225.3 179.8 236.2L224 280.4L332.2 172.2C343.1 161.3 360.9 161.3 371.8 172.2C382.7 183.1 382.7 200.9 371.8 211.8L243.8 339.8zM512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48z"></path></svg>';

  var state = {
    observer: null,
    observedContainer: null,
    debounceTimer: null,
    settings: {
      enableFingerprintQuality: true,
      enableSaveLayout: true,
      enableMetadataMatchHints: true,
      enableMissingPerformerQA: true,
    },
    settingsLoadedAt: 0,
    queryInputBound: null,
  };

  function core() {
    return window.BetterTaggerCore;
  }

  function readBool(raw, fallback) {
    if (raw === true || raw === "true") return true;
    if (raw === false || raw === "false") return false;
    return fallback;
  }

  function gql(query, variables) {
    return fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query, variables: variables || {} }),
    }).then(function (res) {
      return res.json();
    });
  }

  function loadPluginSettings() {
    return gql("query BtCfg { configuration { plugins } }")
      .then(function (j) {
        if (j.errors && j.errors.length) return;
        var plug =
          j.data && j.data.configuration && j.data.configuration.plugins;
        var cfg = null;
        if (plug && typeof plug === "object") {
          cfg = plug[PLUGIN_ID] || null;
          if (!cfg) {
            var k = Object.keys(plug).find(function (key) {
              return String(key).toLowerCase() === String(PLUGIN_ID).toLowerCase();
            });
            if (k) cfg = plug[k];
          }
        }
        if (cfg && typeof cfg === "object") {
          state.settings.enableFingerprintQuality = readBool(
            cfg.enableFingerprintQuality,
            true
          );
          state.settings.enableSaveLayout = readBool(
            cfg.enableSaveLayout,
            true
          );
          state.settings.enableMetadataMatchHints = readBool(
            cfg.enableMetadataMatchHints,
            true
          );
          state.settings.enableMissingPerformerQA = readBool(
            cfg.enableMissingPerformerQA,
            true
          );
        }
        state.settingsLoadedAt = Date.now();
      })
      .catch(function () {
        /* keep defaults */
      });
  }

  function ensureSettings() {
    if (Date.now() - state.settingsLoadedAt < SETTINGS_TTL_MS) {
      return Promise.resolve();
    }
    return loadPluginSettings();
  }

  function removeClasses(el, list) {
    for (var i = 0; i < list.length; i++) el.classList.remove(list[i]);
  }

  function clearSaveLayout(scope) {
    var root = scope || document;
    var nodes = root.querySelectorAll("[data-bt-save-layout]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      el.classList.remove(
        "d-flex",
        "flex-column",
        "mt-auto",
        "w-100",
        "justify-content-end"
      );
      el.removeAttribute("data-bt-save-layout");
    }
  }

  function clearFingerprintMarks(scope) {
    var root = scope || document;
    var marked = root.querySelectorAll("[data-bt-fp-mark]");
    for (var i = 0; i < marked.length; i++) {
      var div = marked[i];
      removeClasses(div, FP_CLASS_LIST);
      var pct = div.querySelector(".bt-fp-pct");
      if (pct && pct.parentNode) pct.parentNode.removeChild(pct);
      div.removeAttribute("data-bt-fp-mark");
    }
  }

  function clearDmMarks(scope) {
    var root = scope || document;
    var fields = root.querySelectorAll("[data-bt-dm-mark]");
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      removeClasses(f, DM_CLASS_LIST);
      f.style.removeProperty("--bt-dm-soft-a");
      f.removeAttribute("data-bt-dm-mark");
    }
    var wraps = root.querySelectorAll(".bt-verified-wrap");
    for (var j = 0; j < wraps.length; j++) {
      var w = wraps[j];
      if (w.parentNode) w.parentNode.removeChild(w);
    }
    var qa = root.querySelectorAll(".bt-qa-missing-performer");
    for (var k = 0; k < qa.length; k++) {
      qa[k].classList.remove("bt-qa-missing-performer");
    }
  }

  function clearAllMarksInContainer(container) {
    clearSaveLayout(container);
    clearFingerprintMarks(container);
    clearDmMarks(container);
  }

  function findTaggerContainer() {
    return document.querySelector(".tagger-container");
  }

  function findQueryInput(container) {
    if (!container) return null;
    var inp = container.querySelector(
      "input.text-input.form-control, input.text-input"
    );
    return inp || null;
  }

  function applySaveLayout(container, enabled) {
    if (!enabled || !container) return;
    var buttons = container.querySelectorAll("button.btn.btn-primary");
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var label = (btn.textContent && btn.textContent.trim()) || "";
      if (label !== "Save") continue;
      var rightCol = btn.closest(".col-lg-6, .col-md-6");
      if (rightCol) {
        rightCol.classList.add("d-flex", "flex-column");
        rightCol.setAttribute("data-bt-save-layout", "1");
      }
      var wrap = btn.parentElement;
      if (wrap && wrap instanceof HTMLElement) {
        wrap.classList.add("mt-auto", "w-100", "d-flex", "justify-content-end");
        wrap.setAttribute("data-bt-save-layout", "1");
      }
    }
  }

  function applyFingerprints(container, enabled) {
    if (!enabled || !container) return;
    var C = core();
    if (!C) return;
    var nodes = container.querySelectorAll("div.font-weight-bold");
    for (var i = 0; i < nodes.length; i++) {
      var div = nodes[i];
      var text = div.textContent || "";
      var match = text.match(/(\d+)\s*\/\s*(\d+)\s*fingerprints/i);
      if (!match) continue;
      var matched = parseInt(match[1], 10);
      var total = parseInt(match[2], 10);
      if (total <= 0) continue;
      var pres = C.fingerprintPresentation(total, matched);
      removeClasses(div, FP_CLASS_LIST);
      div.classList.add(pres.token);
      div.setAttribute("data-bt-fp-mark", "1");
      var marker = div.querySelector(".bt-fp-pct");
      if (!marker) {
        marker = document.createElement("span");
        marker.className = "bt-fp-pct";
        div.appendChild(marker);
      }
      marker.textContent = " (" + pres.pct + "%)";
    }
  }

  function addVerifiedIcon(field, tooltipText) {
    if (!field || field.querySelector(".bt-verified-wrap")) return;
    var container = document.createElement("span");
    container.className = "bt-verified-wrap";
    container.title = tooltipText || "Verified match with filename";
    container.innerHTML = VERIFIED_SVG;
    field.appendChild(container);
  }

  function applyMetadataHints(container, enabled) {
    if (!enabled || !container) return;
    var C = core();
    if (!C) return;
    var queryInp = findQueryInput(container);
    var queryText =
      queryInp && typeof queryInp.value === "string" ? queryInp.value.trim() : "";
    var rows = container.querySelectorAll("div.mt-3.search-item");
    for (var r = 0; r < rows.length; r++) {
      var searchItem = rows[r];
      var sourceLink = searchItem.querySelector("a.scene-link.overflow-hidden");
      if (!sourceLink) sourceLink = searchItem.querySelector("a.scene-link");
      var titlePart =
        sourceLink && sourceLink.textContent
          ? sourceLink.textContent.trim()
          : "";
      var haystack = C.normalizeHaystack(titlePart, queryText);
      var hayLower = haystack.toLowerCase().replace(/'/g, "");

      var resultFields = searchItem.querySelectorAll(".optional-field-content");
      for (var fi = 0; fi < resultFields.length; fi++) {
        var field = resultFields[fi];
        var matchText = field.textContent.trim();
        if (!matchText || matchText.substring(0, 8) === "Matched:") continue;

        var isoDateMatch = field.textContent.match(/^\d{4}-\d{2}-\d{2}$/);
        if (isoDateMatch) {
          var verified = C.isDateVerifiedPattern(matchText, haystack);
          var hasComponents = C.checkDateComponentsInHaystack(matchText, haystack);
          if (verified) {
            addVerifiedIcon(field, "Exact date match in filename");
          } else if (hasComponents) {
            field.classList.add("bt-dm-strong");
            field.setAttribute("data-bt-dm-mark", "1");
          } else {
            var ratio = C.wordOverlapRatio(matchText, hayLower);
            field.style.setProperty("--bt-dm-soft-a", String(ratio * 0.85 + 0.12));
            field.classList.add("bt-dm-soft");
            field.setAttribute("data-bt-dm-mark", "1");
          }
        } else {
          if (hayLower.indexOf(matchText.toLowerCase()) !== -1) {
            field.classList.add("bt-dm-strong");
            field.setAttribute("data-bt-dm-mark", "1");
          } else {
            var wr = C.wordOverlapRatio(matchText, hayLower);
            field.style.setProperty("--bt-dm-soft-a", String(wr * 0.85 + 0.12));
            field.classList.add("bt-dm-soft");
            field.setAttribute("data-bt-dm-mark", "1");
          }
        }
      }

      var entityFields = searchItem.querySelectorAll(".entity-name");
      for (var ei = 0; ei < entityFields.length; ei++) {
        var obfield = entityFields[ei];
        var parts = obfield.textContent.split(":");
        if (parts.length < 2) continue;
        var matchLabel = parts[0].trim();
        var rawText = parts.slice(1).join(":").toLowerCase().trim().replace(/'/g, "");
        var origMatch = rawText.replace(/\s*\(.*?\)\s*$/, "");
        var candidates = C.entityValueCandidates(origMatch);
        var hit = false;
        for (var c = 0; c < candidates.length; c++) {
          if (hayLower.indexOf(candidates[c]) !== -1) {
            hit = true;
            break;
          }
        }
        if (hit) {
          addVerifiedIcon(obfield, matchLabel + " found in filename");
        }
      }
    }
  }

  function findVisibleSaveInSearchItem(searchItem) {
    var buttons = searchItem.querySelectorAll("button.btn.btn-primary");
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (b.textContent.trim() === "Save" && b.offsetParent !== null) return b;
    }
    return null;
  }

  function applyMissingPerformerQA(container, enabled) {
    if (!enabled || !container) return;
    var rows = container.querySelectorAll("div.mt-3.search-item");
    for (var r = 0; r < rows.length; r++) {
      var searchItem = rows[r];
      searchItem.classList.remove("bt-qa-missing-performer");
      var saveBtn = findVisibleSaveInSearchItem(searchItem);
      if (!saveBtn) continue;
      var performerBlocks = searchItem.querySelectorAll(".mt-2 .entity-name");
      var hasPerformerSource = false;
      for (var i = 0; i < performerBlocks.length; i++) {
        if (performerBlocks[i].textContent.trim().indexOf("Performer:") === 0) {
          hasPerformerSource = true;
          break;
        }
      }
      if (!hasPerformerSource) {
        searchItem.classList.add("bt-qa-missing-performer");
      }
    }
  }

  function runPass() {
    var container = findTaggerContainer();
    if (!container) {
      detachAll();
      return;
    }
    ensureSettings().then(function () {
      var s = state.settings;
      clearAllMarksInContainer(container);
      applySaveLayout(container, s.enableSaveLayout);
      applyFingerprints(container, s.enableFingerprintQuality);
      applyMetadataHints(container, s.enableMetadataMatchHints);
      applyMissingPerformerQA(container, s.enableMissingPerformerQA);
    });
  }

  function scheduleRun() {
    if (state.debounceTimer) clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(function () {
      state.debounceTimer = null;
      runPass();
    }, DEBOUNCE_MS);
  }

  function bindQueryInput(container) {
    var inp = findQueryInput(container);
    if (inp === state.queryInputBound) return;
    if (state.queryInputBound) {
      state.queryInputBound.removeEventListener("input", scheduleRun);
      state.queryInputBound = null;
    }
    if (inp) {
      inp.addEventListener("input", scheduleRun);
      state.queryInputBound = inp;
    }
  }

  function detachAll() {
    if (state.observer) {
      state.observer.disconnect();
    }
    state.observer = null;
    state.observedContainer = null;
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
      state.debounceTimer = null;
    }
    if (state.queryInputBound) {
      state.queryInputBound.removeEventListener("input", scheduleRun);
      state.queryInputBound = null;
    }
    clearSaveLayout(document);
    clearFingerprintMarks(document);
    clearDmMarks(document);
  }

  function attachIfNeeded() {
    var container = findTaggerContainer();
    if (!container) {
      detachAll();
      return;
    }
    bindQueryInput(container);
    if (state.observedContainer !== container) {
      if (state.observer) {
        state.observer.disconnect();
      }
      state.observedContainer = container;
      state.observer = new MutationObserver(function () {
        scheduleRun();
      });
      state.observer.observe(container, { childList: true, subtree: true });
    }
    scheduleRun();
  }

  function onLocation() {
    attachIfNeeded();
  }

  function init() {
    if (!window.BetterTaggerCore) {
      console.warn("[BetterTagger] BetterTaggerCore.js not loaded");
    }
    loadPluginSettings().finally(function () {
      attachIfNeeded();
    });
    var api = window.PluginApi;
    if (api && api.Event && api.Event.addEventListener) {
      api.Event.addEventListener("stash:location", onLocation);
    } else {
      window.addEventListener("popstate", onLocation);
    }
    window.addEventListener("beforeunload", detachAll);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
