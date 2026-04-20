"use strict";

(function () {
  var PLUGIN_ID = "BetterTagger";
  var PLUGIN_VERSION = "1.2.23";
  var DEBUG_SAVE_LAYOUT = true;
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
  var PLAY_ICON_SVG =
    '<svg data-prefix="fas" data-icon="eye" class="bt-mini-icon" role="img" viewBox="0 0 576 512" aria-hidden="true"><path fill="currentColor" d="M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1-288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z"></path></svg>';
  var O_ICON_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="bt-mini-icon" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 36 36"><path fill="currentColor" d="M22.855.758L7.875 7.024l12.537 9.733c2.633 2.224 6.377 2.937 9.77 1.518c4.826-2.018 7.096-7.576 5.072-12.413C33.232 1.024 27.68-1.261 22.855.758zm-9.962 17.924L2.05 10.284L.137 23.529a7.993 7.993 0 0 0 2.958 7.803a8.001 8.001 0 0 0 9.798-12.65zm15.339 7.015l-8.156-4.69l-.033 9.223c-.088 2 .904 3.98 2.75 5.041a5.462 5.462 0 0 0 7.479-2.051c1.499-2.644.589-6.013-2.04-7.523z"></path><rect x="0" y="0" width="36" height="36" fill="rgba(0, 0, 0, 0)"></rect></svg>';
  var MARKER_ICON_SVG =
    '<svg data-prefix="fas" data-icon="location-dot" class="bt-mini-icon" role="img" viewBox="0 0 384 512" aria-hidden="true"><path fill="currentColor" d="M0 188.6C0 84.4 86 0 192 0S384 84.4 384 188.6c0 119.3-120.2 262.3-170.4 316.8-11.8 12.8-31.5 12.8-43.3 0-50.2-54.5-170.4-197.5-170.4-316.8zM192 256a64 64 0 1 0 0-128 64 64 0 1 0 0 128z"></path></svg>';
  var GROUP_ICON_SVG =
    '<svg data-prefix="fas" data-icon="film" class="bt-mini-icon" role="img" viewBox="0 0 448 512" aria-hidden="true"><path fill="currentColor" d="M0 96C0 60.7 28.7 32 64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM48 368l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm304-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM48 240l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm304-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM48 112l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16L64 96c-8.8 0-16 7.2-16 16zM352 96c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0z"></path></svg>';

  var state = {
    observer: null,
    bootstrapObserver: null,
    observedContainer: null,
    debounceTimer: null,
    settings: {
      enableFingerprintQuality: true,
      enableSaveLayout: true,
      enableMetadataMatchHints: true,
      enableMissingPerformerQA: true,
      enableSceneDrawerEnhancements: true,
      enableDebugLogging: false,
    },
    settingsLoadedAt: 0,
    queryInputBound: null,
    sceneDataById: {},
    sceneDataPromiseById: {},
  };

  var SCENE_DATA_QUERY =
    "query BtSceneData($id: ID!) {" +
    "  findScene(id: $id) {" +
    "    id title code date director details urls studio { id name } performers { id name } tags { id name } play_count o_counter organized scene_markers { id } groups { group { id } } " +
    "    files { id path size mod_time duration width height frame_rate bit_rate video_codec audio_codec fingerprints { type value } }" +
    "  }" +
    "}";

  function core() {
    return window.BetterTaggerCore;
  }

  function readBool(raw, fallback) {
    if (raw === true || raw === "true") return true;
    if (raw === false || raw === "false") return false;
    if (raw === 1 || raw === "1") return true;
    if (raw === 0 || raw === "0") return false;
    if (raw === "True") return true;
    if (raw === "False") return false;
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
          var drawerMerged = readBool(
            cfg.enableSceneDrawerEnhancements,
            true
          );
          // Legacy compatibility: if old toggles exist, they can still force false.
          if (cfg.enableSceneFileInfo !== undefined) {
            drawerMerged = drawerMerged && readBool(cfg.enableSceneFileInfo, true);
          }
          if (cfg.enableSceneBadges !== undefined) {
            drawerMerged = drawerMerged && readBool(cfg.enableSceneBadges, true);
          }
          state.settings.enableSceneDrawerEnhancements = drawerMerged;
          state.settings.enableDebugLogging = readBool(
            cfg.enableDebugLogging,
            false
          );
          if (state.settings.enableDebugLogging) {
            console.info(
              "[BetterTagger] enableDebugLogging is on — expect [BetterTagger] … diagnostic lines"
            );
          }
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

  function btDebug(tag, payload) {
    if (!state.settings || !state.settings.enableDebugLogging) return;
    if (payload !== undefined) {
      console.info("[BetterTagger]", tag, payload);
    } else {
      console.info("[BetterTagger]", tag);
    }
  }

  function queueMicrotaskCompat(fn) {
    if (typeof queueMicrotask === "function") {
      queueMicrotask(fn);
    } else {
      Promise.resolve().then(fn);
    }
  }

  /** Stash scene tagger: save row in StashSearchResult (OperationButton may omit btn-primary). */
  var BT_TAGGER_SAVE_ROW =
    ".row.no-gutters.mt-2.align-items-center.justify-content-end";

  function isBtElementVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    var st = window.getComputedStyle(el);
    if (st.display === "none" || st.visibility === "hidden") return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  /**
   * Save control inside one stash-box `li.search-result` (expanded / post-scrape).
   */
  function findSaveButtonInSearchResultLi(li) {
    if (!li) return null;
    var structural = li.querySelector(BT_TAGGER_SAVE_ROW + " button.btn");
    if (structural && !structural.classList.contains("btn-link")) {
      if (isBtElementVisible(structural)) return structural;
    }
    var primaries = li.querySelectorAll("button.btn.btn-primary");
    for (var i = 0; i < primaries.length; i++) {
      var b = primaries[i];
      var label = (b.textContent && b.textContent.trim()) || "";
      if (label !== "Save") continue;
      if (isBtElementVisible(b)) return b;
    }
    return null;
  }

  function removeClasses(el, list) {
    for (var i = 0; i < list.length; i++) el.classList.remove(list[i]);
  }

  function clearSaveLayout(scope) {
    var root = scope || document;
    var nodes = root.querySelectorAll("[data-bt-save-layout]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.classList.contains("bt-save-col")) {
        el.classList.remove("bt-save-col", "d-flex", "flex-column");
      }
      if (el.classList.contains("bt-save-row")) {
        el.classList.remove("bt-save-row", "mt-auto", "w-100", "d-flex");
      }
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
    var compare = root.querySelectorAll(".bt-existing-match, .bt-existing-mismatch");
    for (var c = 0; c < compare.length; c++) {
      compare[c].classList.remove("bt-existing-match", "bt-existing-mismatch");
    }
  }

  function clearSceneTaggerAdditions(scope) {
    var root = scope || document;
    var badges = root.querySelectorAll(".bt-scene-badges");
    for (var i = 0; i < badges.length; i++) {
      if (badges[i].parentNode) badges[i].parentNode.removeChild(badges[i]);
    }
    var infoPanels = root.querySelectorAll(".bt-scene-file-info");
    for (var j = 0; j < infoPanels.length; j++) {
      if (infoPanels[j].parentNode) infoPanels[j].parentNode.removeChild(infoPanels[j]);
    }
  }

  function clearAllMarksInContainer(container) {
    clearSaveLayout(container);
    clearFingerprintMarks(container);
    clearDmMarks(container);
    clearSceneTaggerAdditions(container);
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
    if (DEBUG_SAVE_LAYOUT) {
      console.debug("[BetterTagger] save-layout start", {
        enabled: enabled,
        containerFound: !!container,
      });
    }
    var seen = typeof WeakSet !== "undefined" ? new WeakSet() : null;

    function pinOneSaveButton(btn, indexHint) {
      if (!btn || !(btn instanceof HTMLElement)) return;
      if (seen && seen.has(btn)) return;
      var label = (btn.textContent && btn.textContent.trim()) || "";
      var inStructural = !!btn.closest(BT_TAGGER_SAVE_ROW);
      if (!inStructural) {
        if (!btn.classList.contains("btn-primary")) return;
        if (label !== "Save") return;
      }
      if (seen) seen.add(btn);

      var row = btn.parentElement;
      if (!row || !(row instanceof HTMLElement)) return;
      if (DEBUG_SAVE_LAYOUT) {
        console.debug("[BetterTagger] row/button inspection", {
          index: indexHint,
          label: label,
          inStructural: inStructural,
          buttonClass: btn.className,
          rowClass: row && row.className,
        });
      }

      var rightCol = row.closest(".col-lg-6, .col-md-6");
      if (rightCol) {
        rightCol.classList.add("bt-save-col", "d-flex", "flex-column");
        rightCol.setAttribute("data-bt-save-layout", "1");
      }

      row.classList.add(
        "bt-save-row",
        "mt-auto",
        "w-100",
        "d-flex",
        "justify-content-end"
      );
      row.setAttribute("data-bt-save-layout", "1");
      if (DEBUG_SAVE_LAYOUT) {
        console.debug("[BetterTagger] applied save layout", {
          index: indexHint,
          rightColFound: !!rightCol,
        });
      }
    }

    var primaryCandidates = container.querySelectorAll("button.btn.btn-primary");
    if (DEBUG_SAVE_LAYOUT) {
      console.debug(
        "[BetterTagger] save-layout primary candidates",
        primaryCandidates.length
      );
    }
    for (var i = 0; i < primaryCandidates.length; i++) {
      pinOneSaveButton(primaryCandidates[i], i);
    }

    var resultLis = container.querySelectorAll("li.search-result");
    for (var j = 0; j < resultLis.length; j++) {
      pinOneSaveButton(findSaveButtonInSearchResultLi(resultLis[j]), "li-" + j);
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
    var lis = searchItem.querySelectorAll("li.search-result");
    for (var i = 0; i < lis.length; i++) {
      var btn = findSaveButtonInSearchResultLi(lis[i]);
      if (btn) return btn;
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

  function parseSceneIdFromSearchItem(searchItem) {
    var sceneLink = searchItem.querySelector("a.scene-link[href*='/scenes/']");
    if (!sceneLink || !sceneLink.getAttribute) return null;
    var href = sceneLink.getAttribute("href") || "";
    var match = href.match(/\/scenes\/([0-9]+)/);
    return match ? match[1] : null;
  }

  function getFingerprintValue(file, kind) {
    if (!file || !file.fingerprints) return "";
    for (var i = 0; i < file.fingerprints.length; i++) {
      var fp = file.fingerprints[i];
      if (fp.type === kind) return fp.value || "";
    }
    return "";
  }

  function formatBytes(size) {
    var n = Number(size || 0);
    if (!Number.isFinite(n) || n <= 0) return "";
    var units = ["B", "KiB", "MiB", "GiB", "TiB"];
    var idx = 0;
    while (n >= 1024 && idx < units.length - 1) {
      n /= 1024;
      idx++;
    }
    var value = idx === 0 ? String(Math.round(n)) : n.toFixed(2).replace(/\.00$/, "");
    return value + " " + units[idx];
  }

  function formatSeconds(s) {
    var n = Number(s || 0);
    if (!Number.isFinite(n) || n <= 0) return "";
    var total = Math.round(n);
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var sec = total % 60;
    if (h > 0) return h + ":" + String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
    return m + ":" + String(sec).padStart(2, "0");
  }

  function formatBitRate(bitsPerSecond) {
    var n = Number(bitsPerSecond || 0);
    if (!Number.isFinite(n) || n <= 0) return "";
    return (n / 1000000).toFixed(2).replace(/\.00$/, "") + " mbps";
  }

  function formatDate(msOrIso) {
    if (!msOrIso) return "";
    var d = new Date(msOrIso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  }

  function sceneDataCacheGet(sceneId) {
    return state.sceneDataById[sceneId] || null;
  }

  function fetchSceneData(sceneId) {
    if (!sceneId) return Promise.resolve(null);
    if (state.sceneDataById[sceneId]) return Promise.resolve(state.sceneDataById[sceneId]);
    if (state.sceneDataPromiseById[sceneId]) return state.sceneDataPromiseById[sceneId];

    state.sceneDataPromiseById[sceneId] = gql(SCENE_DATA_QUERY, { id: sceneId })
      .then(function (resp) {
        if (resp && resp.data && resp.data.findScene) {
          state.sceneDataById[sceneId] = resp.data.findScene;
        }
        return state.sceneDataById[sceneId] || null;
      })
      .catch(function () {
        return null;
      })
      .finally(function () {
        delete state.sceneDataPromiseById[sceneId];
      });
    return state.sceneDataPromiseById[sceneId];
  }

  function renderSceneBadges(searchItem, scene) {
    var drawerCol = searchItem.querySelector(".original-scene-details .collapse .col.col-lg-6");
    if (!drawerCol) return;
    var row = drawerCol.querySelector(".bt-scene-badges");
    if (!row) {
      row = document.createElement("div");
      row.className = "bt-scene-badges";
      drawerCol.appendChild(row);
    }

    var markers = (scene.scene_markers && scene.scene_markers.length) || 0;
    var groups = (scene.groups && scene.groups.length) || 0;
    var playCount = Number(scene.play_count || 0);
    var oCount = Number(scene.o_counter || 0);
    var organized = !!scene.organized;
    row.innerHTML =
      '<span class="bt-mini-badge" title="Play Count">' +
      PLAY_ICON_SVG +
      '<span class="bt-mini-badge-value">' +
      playCount +
      "</span></span>" +
      '<span class="bt-mini-badge" title="Markers">' +
      MARKER_ICON_SVG +
      '<span class="bt-mini-badge-value">' +
      markers +
      "</span></span>" +
      '<span class="bt-mini-badge" title="Groups">' +
      GROUP_ICON_SVG +
      '<span class="bt-mini-badge-value">' +
      groups +
      "</span></span>" +
      '<span class="bt-mini-badge" title="O Count">' +
      O_ICON_SVG +
      '<span class="bt-mini-badge-value">' +
      oCount +
      "</span></span>" +
      (organized
        ? '<span class="bt-mini-badge bt-mini-badge-ok" title="Organized">ORG</span>'
        : "");
  }

  function renderSceneFileInfo(searchItem, scene) {
    var drawerCol = searchItem.querySelector(".original-scene-details .collapse .col.col-lg-6");
    if (!drawerCol) return;
    var file = scene.files && scene.files.length ? scene.files[0] : null;
    if (!file) return;
    var panel = drawerCol.querySelector(".bt-scene-file-info");
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "bt-scene-file-info";
      drawerCol.appendChild(panel);
    }
    var oshash = getFingerprintValue(file, "oshash");
    var phash = getFingerprintValue(file, "phash");
    var md5 = getFingerprintValue(file, "md5");
    var dims = file.width && file.height ? file.width + " x " + file.height : "";
    panel.innerHTML =
      '<dl class="container scene-file-info details-list bt-scene-file-dl">' +
      (oshash ? "<dt>oshash</dt><dd>" + oshash + "</dd>" : "") +
      (md5 ? "<dt>md5</dt><dd>" + md5 + "</dd>" : "") +
      (phash ? "<dt>phash</dt><dd>" + phash + "</dd>" : "") +
      (file.path ? "<dt>path</dt><dd>" + file.path + "</dd>" : "") +
      (file.size ? "<dt>size</dt><dd>" + formatBytes(file.size) + "</dd>" : "") +
      (file.mod_time ? "<dt>mod time</dt><dd>" + formatDate(file.mod_time) + "</dd>" : "") +
      (file.duration ? "<dt>duration</dt><dd>" + formatSeconds(file.duration) + "</dd>" : "") +
      (dims ? "<dt>dimensions</dt><dd>" + dims + "</dd>" : "") +
      (file.frame_rate ? "<dt>fps</dt><dd>" + Number(file.frame_rate).toFixed(2).replace(/\.00$/, "") + "</dd>" : "") +
      (file.bit_rate ? "<dt>bitrate</dt><dd>" + formatBitRate(file.bit_rate) + "</dd>" : "") +
      (file.video_codec ? "<dt>video</dt><dd>" + file.video_codec + "</dd>" : "") +
      (file.audio_codec ? "<dt>audio</dt><dd>" + file.audio_codec + "</dd>" : "") +
      "</dl>";
  }

  function applySceneTaggerAdditions(container, enableFileInfo, enableBadges) {
    if (!container || (!enableFileInfo && !enableBadges)) return;
    var rows = container.querySelectorAll("div.mt-3.search-item");
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var sceneId = parseSceneIdFromSearchItem(row);
      if (!sceneId) continue;

      var scene = sceneDataCacheGet(sceneId);
      if (!scene) {
        fetchSceneData(sceneId).then(function () {
          scheduleRun();
        });
        continue;
      }

      if (enableBadges) renderSceneBadges(row, scene);
      if (enableFileInfo) renderSceneFileInfo(row, scene);
    }
  }

  function normalizeCompareText(v) {
    return String(v || "").trim().toUpperCase();
  }

  function applyCompareResult(fieldEl, isMatch) {
    if (!fieldEl) return;
    fieldEl.classList.remove("bt-existing-match", "bt-existing-mismatch");

    if (isMatch === true) {
      // Exact local match wins over metadata highlight signals.
      fieldEl.classList.remove("bt-dm-strong", "bt-dm-soft");
      fieldEl.style.removeProperty("--bt-dm-soft-a");
      var verified = fieldEl.querySelector(".bt-verified-wrap");
      if (verified && verified.parentNode) verified.parentNode.removeChild(verified);
      fieldEl.classList.add("bt-existing-match");
      return;
    }
    if (isMatch === false) {
      fieldEl.classList.add("bt-existing-mismatch");
    }
  }

  function compareField(fieldEl, existingValue, displayedOverride, debugKey, sceneId) {
    if (!fieldEl) return;
    var right = normalizeCompareText(existingValue);
    if (!right) {
      // underlying null/empty => no behavior
      applyCompareResult(fieldEl, null);
      btDebug("compare-field", {
        sceneId: sceneId,
        key: debugKey,
        skipped: true,
        reason: "existing-empty",
      });
      return;
    }
    var left = normalizeCompareText(
      displayedOverride !== undefined ? displayedOverride : fieldEl.textContent
    );
    btDebug("compare-field", {
      sceneId: sceneId,
      key: debugKey,
      left: left,
      right: right,
      match: left === right,
    });
    applyCompareResult(fieldEl, left === right);
  }

  function stripLeadingEntityLabel(text) {
    var t = String(text || "").trim();
    var idx = t.indexOf(":");
    if (idx >= 0) return t.slice(idx + 1).trim();
    return t;
  }

  function parseNumericIdFromHref(href, kind) {
    if (!href) return null;
    var re = kind === "studio"
      ? /\/studios\/([0-9]+)(?:[/?#]|$)/
      : /\/performers\/([0-9]+)(?:[/?#]|$)/;
    var m = String(href).match(re);
    return m ? m[1] : null;
  }

  function isPerformerFilterHref(href) {
    var s = String(href || "");
    return (
      s.indexOf("/performers/") !== -1 ||
      s.indexOf("%22type%22:%22performers%22") !== -1 ||
      s.indexOf('"type":"performers"') !== -1
    );
  }

  function parsePerformerIdFromHref(href) {
    var direct = parseNumericIdFromHref(href, "performer");
    if (direct) return direct;
    var s = String(href || "");
    var m = s.match(/%22id%22:%22([0-9]+)%22/);
    if (m) return m[1];
    try {
      var decoded = decodeURIComponent(s);
      var m2 = decoded.match(/"id":"([0-9]+)"/);
      if (m2) return m2[1];
    } catch (e) {
      // ignore decode errors and return empty
    }
    return "";
  }

  function extractSelectedStudioId(activeResult) {
    if (!activeResult) return null;
    // Prefer the internal selected-link target shown on the right side "Matched:" block.
    var internalMatchedLink = activeResult.querySelector(
      ".optional-field-content a[href^='/studios/']"
    );
    if (!internalMatchedLink) {
      internalMatchedLink = activeResult.querySelector("a[href^='/studios/']");
    }
    var fromLink =
      internalMatchedLink &&
      parseNumericIdFromHref(internalMatchedLink.getAttribute("href"), "studio");
    if (fromLink) return fromLink;

    var hidden = activeResult.querySelector(
      ".studio-select input[type='hidden'][value]"
    );
    if (hidden && hidden.value) return String(hidden.value).trim();
    return null;
  }

  function extractSelectedPerformerIds(activeResult) {
    if (!activeResult) return [];
    var ids = {};

    // Prefer right-side matched local performer links in OptionalField content.
    var links = activeResult.querySelectorAll(
      ".optional-field-content a[href^='/performers/']"
    );
    if (!links.length) {
      links = activeResult.querySelectorAll("a[href^='/performers/']");
    }
    for (var i = 0; i < links.length; i++) {
      var id = parseNumericIdFromHref(links[i].getAttribute("href"), "performer");
      if (id) ids[id] = true;
    }
    var hiddenInputs = activeResult.querySelectorAll(
      ".react-select input[type='hidden'][value]"
    );
    for (var j = 0; j < hiddenInputs.length; j++) {
      var v = String(hiddenInputs[j].value || "").trim();
      if (/^[0-9]+$/.test(v)) ids[v] = true;
    }
    return Object.keys(ids);
  }

  function extractRowSelectedPerformerId(performerContainer) {
    if (!performerContainer) return "";
    var matchedLink =
      performerContainer.querySelector(
        ".optional-field-content a[href^='/performers/']"
      ) || performerContainer.querySelector("a[href^='/performers/']");
    var linkId =
      matchedLink &&
      parseNumericIdFromHref(matchedLink.getAttribute("href"), "performer");
    if (linkId) return linkId;

    var hidden = performerContainer.querySelector(
      ".react-select input[type='hidden'][value]"
    );
    if (hidden && /^[0-9]+$/.test(String(hidden.value || "").trim())) {
      return String(hidden.value).trim();
    }
    return "";
  }

  function collectProposedTagNames(activeResult) {
    var proposed = {};
    if (!activeResult) return proposed;
    var chips = activeResult.querySelectorAll(
      ".tag-select .react-select__multi-value, .tag-item"
    );
    for (var i = 0; i < chips.length; i++) {
      var chip = chips[i];
      var clone = chip.cloneNode(true);
      var strip = clone.querySelectorAll(
        "button, .react-select__multi-value__remove"
      );
      for (var s = 0; s < strip.length; s++) {
        if (strip[s].parentNode) strip[s].parentNode.removeChild(strip[s]);
      }
      var nm = normalizeCompareText(clone.textContent || "");
      if (nm) proposed[nm] = true;
    }
    return proposed;
  }

  /**
   * Root DOM for the scraped result row that is in "confirmation" mode.
   * Stash marks selected results as `li` with classes `search-result selected-result active`.
   * Fallback: any `li.search-result` subtree that contains a visible Save button.
   */
  function findScrapedConfirmationRoot(searchItem) {
    if (!searchItem) {
      btDebug("confirm-root", { miss: true, why: "no-searchItem" });
      return null;
    }
    var byClass =
      searchItem.querySelector("li.search-result.selected-result.active") ||
      searchItem.querySelector("li.search-result.active");
    if (byClass && findSaveButtonInSearchResultLi(byClass)) {
      return byClass;
    }

    var rows = searchItem.querySelectorAll("li.search-result");
    for (var i = 0; i < rows.length; i++) {
      var li = rows[i];
      if (findSaveButtonInSearchResultLi(li)) {
        return li;
      }
    }

    // Idle rows have no stash-box `li.search-result` yet — logging that every pass is noise.
    if (rows.length > 0 || byClass) {
      btDebug("confirm-root", {
        miss: true,
        liCount: rows.length,
        hadActiveLi: !!byClass,
        activeLiClass: byClass && byClass.className,
        firstStructural: !!(
          rows[0] && rows[0].querySelector(BT_TAGGER_SAVE_ROW)
        ),
      });
    }
    return null;
  }

  function applyExistingDataCompare(searchItem, existingScene) {
    if (!searchItem || !existingScene) {
      btDebug("compare-skip", {
        why: !searchItem ? "no-searchItem" : "no-existingScene",
      });
      return;
    }
    var sceneId = parseSceneIdFromSearchItem(searchItem);
    // Only compare when scrape UI is present: visible Save in the scraped result row.
    var activeResult = findScrapedConfirmationRoot(searchItem);
    if (!activeResult) {
      var pendingResults = searchItem.querySelectorAll("li.search-result")
        .length;
      if (pendingResults > 0) {
        btDebug("compare-skip", {
          sceneId: sceneId,
          why: "no-confirmation-root",
          liSearchResultCount: pendingResults,
        });
      }
      return;
    }

    // Title field
    var titleField = activeResult.querySelector(
      ".scene-metadata h4 .optional-field-content"
    );
    var tagBadgesAll = activeResult.querySelectorAll(".tag-item");
    var tagBadgeWithActions = 0;
    for (var tbi = 0; tbi < tagBadgesAll.length; tbi++) {
      if (tagBadgesAll[tbi].querySelector("button")) tagBadgeWithActions++;
    }
    btDebug("compare-run", {
      sceneId: sceneId,
      titleField: !!titleField,
      metaH5Count: activeResult.querySelectorAll(
        ".scene-metadata h5 .optional-field-content"
      ).length,
      tagItemBadgeWithActions: tagBadgeWithActions,
      tagSelectMultiValueCount: activeResult.querySelectorAll(
        ".tag-select .react-select__multi-value"
      ).length,
    });
    compareField(titleField, existingScene.title, undefined, "title", sceneId);

    // H5 optional fields: match by known value content, not positional label assumptions.
    var allH5Fields = activeResult.querySelectorAll("h5 .optional-field-content");
    var unmatchedH5 = [];
    for (var i = 0; i < allH5Fields.length; i++) unmatchedH5.push(allH5Fields[i]);

    function takeMatchByNormalizedValue(targetValue, transform) {
      var targetNorm = normalizeCompareText(targetValue);
      if (!targetNorm) return null;
      for (var hi = 0; hi < unmatchedH5.length; hi++) {
        var node = unmatchedH5[hi];
        var raw = node && node.textContent ? node.textContent : "";
        var candidate = transform ? transform(raw) : raw;
        if (normalizeCompareText(candidate) === targetNorm) {
          unmatchedH5.splice(hi, 1);
          return node;
        }
      }
      return null;
    }

    // Date
    var dateField = takeMatchByNormalizedValue(existingScene.date);
    if (dateField) {
      compareField(dateField, existingScene.date, undefined, "date", sceneId);
    } else {
      btDebug("compare-field", {
        sceneId: sceneId,
        key: "date",
        skipped: true,
        reason: "no-h5-value-match",
      });
    }

    // Code
    var codeField = takeMatchByNormalizedValue(existingScene.code);
    if (codeField) {
      compareField(codeField, existingScene.code, undefined, "code", sceneId);
    } else {
      btDebug("compare-field", {
        sceneId: sceneId,
        key: "code",
        skipped: true,
        reason: "no-h5-value-match",
      });
    }

    // Director (label may be present in UI text; normalize with prefix strip)
    var directorField = takeMatchByNormalizedValue(
      existingScene.director,
      function (txt) {
        return String(txt || "").replace(/^director:\s*/i, "");
      }
    );
    if (directorField) {
      var directorText = (directorField.textContent || "")
        .replace(/^director:\s*/i, "")
        .trim();
      compareField(
        directorField,
        existingScene.director,
        directorText,
        "director",
        sceneId
      );
    } else {
      btDebug("compare-field", {
        sceneId: sceneId,
        key: "director",
        skipped: true,
        reason: "no-h5-value-match",
      });
    }

    // Studio compare by selected target id (what would be saved), not raw source name text.
    var existingStudioId = existingScene.studio && existingScene.studio.id
      ? String(existingScene.studio.id)
      : "";
    var matchedLocalStudioId = extractSelectedStudioId(activeResult) || "";
    var studioRows = activeResult.querySelectorAll(".entity-name");
    for (var sri = 0; sri < studioRows.length; sri++) {
      var studioRow = studioRows[sri];
      var rawStudioText = (studioRow.textContent || "").trim();
      if (!/^studio/i.test(rawStudioText)) continue;
      var studioContainer = studioRow.closest(".row.no-gutters") || studioRow.parentElement;
      var studioTarget =
        (studioContainer &&
          (studioContainer.querySelector(".optional-field-content a[href^='/studios/']") ||
            studioContainer.querySelector("a[href^='/studios/']"))) ||
        studioRow.querySelector("a[href^='/studios/']") ||
        studioRow;
      if (!existingStudioId || !matchedLocalStudioId) {
        applyCompareResult(studioTarget, null);
        btDebug("compare-field", {
          sceneId: sceneId,
          key: "studio",
          existingLocalId: existingStudioId,
          matchedLocalId: matchedLocalStudioId,
          skipped: true,
          reason: "missing-id",
        });
      } else {
        applyCompareResult(studioTarget, matchedLocalStudioId === existingStudioId);
        btDebug("compare-field", {
          sceneId: sceneId,
          key: "studio",
          existingLocalId: existingStudioId,
          matchedLocalId: matchedLocalStudioId,
          match: matchedLocalStudioId === existingStudioId,
        });
      }
    }

    // Performer compare by selected target ids (what would be saved).
    var existingPerformerSet = {};
    var existingPerformers = existingScene.performers || [];
    for (var epi = 0; epi < existingPerformers.length; epi++) {
      var epId = existingPerformers[epi] && existingPerformers[epi].id;
      if (epId) existingPerformerSet[String(epId)] = true;
    }
    var existingPerformerCount = Object.keys(existingPerformerSet).length;
    var selectedPerformerIds = extractSelectedPerformerIds(activeResult);
    var performerRows = activeResult.querySelectorAll(".entity-name");
    for (var pri = 0; pri < performerRows.length; pri++) {
      var performerRow = performerRows[pri];
      var rawPerformerText = (performerRow.textContent || "").trim();
      if (!/^performer/i.test(rawPerformerText)) continue;
      var performerContainer = performerRow.closest(".row.no-gutters") || performerRow.parentElement;
      var performerTarget =
        (performerContainer &&
          (performerContainer.querySelector(
            ".optional-field-content a[href^='/performers/']"
          ) ||
            performerContainer.querySelector("a[href^='/performers/']"))) ||
        performerRow.querySelector("a[href^='/performers/']") ||
        performerRow;
      var performerId = extractRowSelectedPerformerId(performerContainer);
      if (!existingPerformerCount || !performerId) {
        applyCompareResult(performerTarget, null);
        btDebug("compare-field", {
          sceneId: sceneId,
          key: "performer",
          leftId: performerId || "",
          selectedSetSize: selectedPerformerIds.length,
          skipped: true,
          reason: !existingPerformerCount ? "existing-empty" : "missing-id",
        });
      } else {
        var performerMatch = !!existingPerformerSet[String(performerId)];
        applyCompareResult(performerTarget, performerMatch);
        btDebug("compare-field", {
          sceneId: sceneId,
          key: "performer",
          leftId: String(performerId),
          rightSetSize: existingPerformerCount,
          selectedSetSize: selectedPerformerIds.length,
          match: performerMatch,
        });
      }
    }

    // Tag badges in scene tagger: show existing local tags as green.
    var existingTags = (existingScene.tags || [])
      .map(function (t) {
        return normalizeCompareText(t && t.name);
      })
      .filter(function (v) {
        return !!v;
      });
    if (existingTags.length) {
      var existingSet = {};
      for (var ti = 0; ti < existingTags.length; ti++) existingSet[existingTags[ti]] = true;

      function compareTagLabelTextFromEl(el) {
        var clone = el.cloneNode(true);
        var strip = clone.querySelectorAll(
          "button, .react-select__multi-value__remove"
        );
        for (var si = 0; si < strip.length; si++) {
          if (strip[si].parentNode) strip[si].parentNode.removeChild(strip[si]);
        }
        return normalizeCompareText(clone.textContent || "");
      }

      function markProposedTagDelta(chipEl) {
        if (!chipEl) return;
        chipEl.classList.remove("bt-existing-match", "bt-existing-mismatch");
        var nm = compareTagLabelTextFromEl(chipEl);
        // Green = tag will be added by save (not currently on existing scene).
        if (nm && !existingSet[nm]) chipEl.classList.add("bt-existing-match");
      }

      // Scraped tags that still need create/link (Badge.tag-item + action buttons).
      var tagBadges = activeResult.querySelectorAll(".tag-item");
      for (var bi = 0; bi < tagBadges.length; bi++) {
        var badge = tagBadges[bi];
        if (!badge.querySelector("button")) continue;
        markProposedTagDelta(badge);
      }

      // Tags already linked on the scene (TagSelect / react-select multi-value chips).
      var multiVals = activeResult.querySelectorAll(
        ".tag-select .react-select__multi-value"
      );
      for (var mi = 0; mi < multiVals.length; mi++) {
        markProposedTagDelta(multiVals[mi]);
      }

      // Drawer existing tags: green if staying, red if removed by proposed update.
      var proposedTagNames = collectProposedTagNames(activeResult);
      var drawerTags = searchItem.querySelectorAll(
        ".original-scene-details .tag-item.tag-link"
      );
      for (var di = 0; di < drawerTags.length; di++) {
        var dtag = drawerTags[di];
        var dlink = dtag.querySelector("a[href]");
        var dhref = dlink && dlink.getAttribute ? dlink.getAttribute("href") : "";
        // TagLink in drawer may point to filtered scene URLs, not /tags/<id>.
        // Exclude performer links explicitly and treat remaining tag-link badges as tags.
        if (isPerformerFilterHref(dhref)) continue;
        dtag.classList.remove("bt-existing-match", "bt-existing-mismatch");
        var dname = normalizeCompareText(dtag.textContent || "");
        if (!dname) continue;
        // Drawer: red indicates tag would be removed by save.
        if (!proposedTagNames[dname]) {
          dtag.classList.add("bt-existing-mismatch");
        }
      }

      // Drawer existing performers: green if present in incoming/matched performer set,
      // red if not present.
      var incomingPerformerIds = extractSelectedPerformerIds(activeResult);
      var incomingPerformerSet = {};
      for (var ipi = 0; ipi < incomingPerformerIds.length; ipi++) {
        incomingPerformerSet[incomingPerformerIds[ipi]] = true;
      }
      if (incomingPerformerIds.length) {
        var drawerPerformerLinks = searchItem.querySelectorAll(
          ".original-scene-details .tag-item.tag-link a[href]"
        );
        for (var dpi = 0; dpi < drawerPerformerLinks.length; dpi++) {
          var plink = drawerPerformerLinks[dpi];
          var phref = plink.getAttribute ? plink.getAttribute("href") : "";
          if (!isPerformerFilterHref(phref)) continue;
          var pid = parsePerformerIdFromHref(phref);
          if (!pid) continue;
          var pchip = plink.closest(".tag-item.tag-link") || plink;
          pchip.classList.remove("bt-existing-match", "bt-existing-mismatch");
          if (incomingPerformerSet[String(pid)]) {
            pchip.classList.add("bt-existing-match");
          } else {
            pchip.classList.add("bt-existing-mismatch");
          }
        }
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
      var obs = state.observer;
      var observed = state.observedContainer;
      var pauseObserver =
        obs && observed && container && observed === container;
      if (pauseObserver) {
        obs.disconnect();
      }
      try {
        var s = state.settings;
        clearAllMarksInContainer(container);
        applySaveLayout(container, s.enableSaveLayout);
        applyFingerprints(container, s.enableFingerprintQuality);
        applyMetadataHints(container, s.enableMetadataMatchHints);
        applyMissingPerformerQA(container, s.enableMissingPerformerQA);
        applySceneTaggerAdditions(
          container,
          s.enableSceneDrawerEnhancements,
          s.enableSceneDrawerEnhancements
        );

        // SceneTaggerColorizer-style compare against existing local scene data:
        // - null underlying: no behavior
        // - exact (trim/upper): green + suppress other highlights
        // - non-null mismatch: red
        var rows = container.querySelectorAll("div.mt-3.search-item");
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var sceneId = parseSceneIdFromSearchItem(row);
          if (!sceneId) continue;
          var existingScene = sceneDataCacheGet(sceneId);
          if (!existingScene) {
            fetchSceneData(sceneId).then(function () {
              scheduleRun();
            });
            continue;
          }
          applyExistingDataCompare(row, existingScene);
        }
      } finally {
        if (pauseObserver) {
          queueMicrotaskCompat(function () {
            if (state.observer !== obs) return;
            var root = state.observedContainer;
            if (!root || !(root instanceof Node)) return;
            try {
              if (!document.documentElement.contains(root)) return;
            } catch (e) {
              return;
            }
            obs.observe(root, { childList: true, subtree: true });
          });
        }
      }
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

  function ensureBootstrapObserver() {
    if (state.bootstrapObserver) return;
    var root = document.body || document.documentElement;
    if (!root) return;

    state.bootstrapObserver = new MutationObserver(function () {
      attachIfNeeded();
    });
    state.bootstrapObserver.observe(root, { childList: true, subtree: true });
    console.warn("[BetterTagger] bootstrap observer attached");
  }

  function attachIfNeeded() {
    var container = findTaggerContainer();
    if (!container) {
      detachAll();
      ensureBootstrapObserver();
      return;
    }

    if (state.bootstrapObserver) {
      state.bootstrapObserver.disconnect();
      state.bootstrapObserver = null;
      console.warn("[BetterTagger] bootstrap observer detached (container found)");
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
      console.warn("[BetterTagger] container observer attached");
    }
    scheduleRun();
  }

  function onLocation() {
    attachIfNeeded();
  }

  function installLegacyCrashGuard() {
    var legacy = window.Stash;
    if (!legacy || legacy.__btGuardInstalled) return;

    // Legacy userscripts may expose crashing handlers on window.Stash.
    // Wrap known methods so they fail closed instead of flooding the console.
    if (typeof legacy.parseSearchResultItem === "function") {
      var originalParse = legacy.parseSearchResultItem;
      legacy.parseSearchResultItem = function () {
        try {
          return originalParse.apply(this, arguments);
        } catch (e) {
          return {
            title: "",
            date: "",
            url: "",
            optionalFields: [],
            entities: [],
          };
        }
      };
    }

    if (typeof legacy.colorizeSearchItem === "function") {
      var originalColorize = legacy.colorizeSearchItem;
      legacy.colorizeSearchItem = function () {
        try {
          return originalColorize.apply(this, arguments);
        } catch (e) {
          return;
        }
      };
    }

    legacy.__btGuardInstalled = true;
  }

  function installLegacyErrorFilter() {
    if (window.__btLegacyErrorFilterInstalled) return;

    function isLegacyNoise(errLike) {
      var text = "";
      if (typeof errLike === "string") {
        text = errLike;
      } else if (errLike && typeof errLike.message === "string") {
        text = errLike.message;
      }
      var stack = (errLike && errLike.stack) || "";
      var body = String(text) + "\n" + String(stack);
      return (
        body.indexOf("parseSearchResultItem") !== -1 ||
        body.indexOf("colorizeSearchItem") !== -1 ||
        body.indexOf("Cannot read properties of undefined (reading 'date')") !== -1
      );
    }

    window.addEventListener(
      "error",
      function (event) {
        if (isLegacyNoise(event.error || event.message)) {
          event.preventDefault();
        }
      },
      true
    );

    window.addEventListener("unhandledrejection", function (event) {
      var reason = event.reason;
      if (isLegacyNoise(reason)) {
        event.preventDefault();
      }
    });

    // Legacy fallback paths used by some injected scripts:
    // handle global onerror/onunhandledrejection directly as well.
    var prevOnError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
      if (isLegacyNoise(error || message)) return true;
      if (typeof prevOnError === "function") {
        return prevOnError.apply(this, arguments);
      }
      return false;
    };

    var prevOnUnhandled = window.onunhandledrejection;
    window.onunhandledrejection = function (event) {
      if (event && isLegacyNoise(event.reason)) return true;
      if (typeof prevOnUnhandled === "function") {
        return prevOnUnhandled.apply(this, arguments);
      }
      return false;
    };

    window.__btLegacyErrorFilterInstalled = true;
  }

  function init() {
    console.info("[BetterTagger] loaded", { version: PLUGIN_VERSION });
    window.__betterTaggerRuntime = {
      loaded: true,
      version: PLUGIN_VERSION,
      ts: Date.now(),
    };
    console.warn("[BetterTagger] runtime marker", window.__betterTaggerRuntime);
    installLegacyErrorFilter();
    installLegacyCrashGuard();
    if (!window.BetterTaggerCore) {
      console.warn("[BetterTagger] BetterTaggerCore.js not loaded");
    }
    loadPluginSettings().finally(function () {
      attachIfNeeded();
      ensureBootstrapObserver();
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
