/**
 * BetterTagger — pure helpers (no DOM). Consumed by BetterTagger.js.
 * Mirrors legacy COLOR_RULES / date / entity intent from legacy-tampermonkey/DataMatches.js.
 */
(function (global) {
  "use strict";

  /** @type {{ maxTotal: number, bands: { maxRatio: number, token: string }[] }[]} */
  var FP_TIERS = [
    {
      maxTotal: 10,
      bands: [
        { maxRatio: 0.45, token: "bt-fp-severe" },
        { maxRatio: 0.6, token: "bt-fp-warn" },
        { maxRatio: 1, token: "bt-fp-good" },
      ],
    },
    {
      maxTotal: 50,
      bands: [
        { maxRatio: 0.3, token: "bt-fp-severe" },
        { maxRatio: 0.5, token: "bt-fp-warn" },
        { maxRatio: 0.75, token: "bt-fp-caution" },
        { maxRatio: 1, token: "bt-fp-good" },
      ],
    },
    {
      maxTotal: Infinity,
      bands: [
        { maxRatio: 0.2, token: "bt-fp-severe" },
        { maxRatio: 0.4, token: "bt-fp-warn" },
        { maxRatio: 0.75, token: "bt-fp-caution" },
        { maxRatio: 1, token: "bt-fp-good" },
      ],
    },
  ];

  function fpTierIndex(total) {
    if (total <= 10) return 0;
    if (total <= 50) return 1;
    return 2;
  }

  /**
   * @param {number} total
   * @param {number} matched
   * @returns {{ token: string, ratio: number, pct: number }}
   */
  function fingerprintPresentation(total, matched) {
    var ratio = total > 0 ? matched / total : 0;
    var pct = Math.round(ratio * 100);
    var tier = FP_TIERS[fpTierIndex(total)];
    var token = "bt-fp-good";
    for (var i = 0; i < tier.bands.length; i++) {
      if (ratio <= tier.bands[i].maxRatio) {
        token = tier.bands[i].token;
        break;
      }
    }
    return { token: token, ratio: ratio, pct: pct };
  }

  function normalizeHaystack(title, query) {
    var t = (title || "").trim();
    var q = (query || "").trim();
    if (!q) return t;
    return (t + " " + q).trim();
  }

  function checkDateComponentsInHaystack(isoDate, haystack) {
    var m = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return false;
    var year = m[1];
    var mm = m[2];
    var dd = m[3];
    var yy = year.slice(2);
    var h = haystack || "";
    return h.includes(yy) && h.includes(mm) && h.includes(dd);
  }

  function isDateVerifiedPattern(isoDate, haystack) {
    var match = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;
    var year = match[1];
    var mm = match[2];
    var dd = match[3];
    var yy = year.slice(2);
    var patterns = [
      new RegExp(yy + "[.\\- ]" + mm + "[.\\- ]" + dd),
      new RegExp(year + "[.\\- ]" + mm + "[.\\- ]" + dd),
      new RegExp("" + yy + mm + dd),
    ];
    for (var i = 0; i < patterns.length; i++) {
      if (patterns[i].test(haystack)) return true;
    }
    return false;
  }

  /**
   * @param {string} fieldText
   * @param {string} haystackLower
   * @returns {number} 0..1 for CSS opacity multiplier
   */
  function wordOverlapRatio(fieldText, haystackLower) {
    var fieldWords = String(fieldText)
      .trim()
      .toLowerCase()
      .split(/\s+/);
    var target = haystackLower || "";
    var matchCount = 0;
    for (var i = 0; i < fieldWords.length; i++) {
      var w = fieldWords[i];
      if (w && target.indexOf(w) !== -1) matchCount++;
    }
    if (!fieldWords.length) return 0;
    return Math.min(matchCount / fieldWords.length, 1);
  }

  function entityValueCandidates(rawLowerNoApos) {
    var orig = String(rawLowerNoApos).trim();
    return [
      orig,
      orig.replace(/ /g, ""),
      orig.replace(/ /g, "."),
      orig.replace(/ /g, "_"),
      orig.replace(/ /g, "-"),
    ];
  }

  global.BetterTaggerCore = {
    FP_TIERS: FP_TIERS,
    fingerprintPresentation: fingerprintPresentation,
    normalizeHaystack: normalizeHaystack,
    checkDateComponentsInHaystack: checkDateComponentsInHaystack,
    isDateVerifiedPattern: isDateVerifiedPattern,
    wordOverlapRatio: wordOverlapRatio,
    entityValueCandidates: entityValueCandidates,
  };
})(typeof window !== "undefined" ? window : self);
