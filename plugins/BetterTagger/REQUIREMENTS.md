# BetterTagger — requirements and acceptance

Tampermonkey sources are **reference only** ([`legacy-tampermonkey/`](./legacy-tampermonkey/)). This document is the contract for the native plugin.

## Scope

- **Full parity (v1):** Scene list **Tagger** display mode (stash-box scene rows under `.tagger-container`).
- **Other taggers** (tag / studio / performer): plugin must **no-op safely** (no errors) when DOM does not match scene-row assumptions.

## REQ — Fingerprint match summary

| ID | Requirement | Acceptance |
|----|-------------|------------|
| **REQ-FP-1** | Where the UI shows a matched/total **fingerprint** count (`N / M fingerprints`, case-insensitive), show **match rate** as a visible percentage next to that summary. | Percent appears once; survives re-run without duplication. |
| **REQ-FP-2** | Encode match quality with **tiered thresholds** that depend on **total** fingerprint count (small / medium / large pools), matching the **intent** of legacy COLOR_RULES (stricter when few prints). | Visual band changes when total or ratio changes; colors documented in CSS tokens. |
| **REQ-FP-3** | Idempotent under React refresh. | Re-renders do not stack duplicate suffixes; observer is debounced and scoped. |

## REQ — Save control layout

| ID | Requirement | Acceptance |
|----|-------------|------------|
| **REQ-SAVE-1** | Only when `.tagger-container` is present, **Save** for an active stash-box result sits at the **bottom-end** of the right-hand column. | Primary Save rows align visually as in legacy `buttonFix.js`. |
| **REQ-SAVE-2** | Only the **Save** action is targeted (default: `textContent.trim() === "Save"`). | Non-Save primary buttons in tagger are unchanged. |
| **REQ-SAVE-3** | No layout changes outside tagger context. | Navigating away removes applied layout classes from nodes we touched (tracked with `data-bt-save-layout`). |

## REQ — Metadata / filename hints

| ID | Requirement | Acceptance |
|----|-------------|------------|
| **REQ-DM-1** | **Haystack** per scene row = trimmed scene title link text + trimmed tagger query input (scoped under `.tagger-container`). | Changing query input updates hints after debounce. |
| **REQ-DM-2** | ISO `YYYY-MM-DD` optional fields: verified date patterns → **icon** + tooltip; YY/MM/DD components all in haystack → **strong** fill; else soft word-overlap gradient. | Matches legacy `DataMatches.js` intent for date branches. |
| **REQ-DM-3** | Non-date optional fields: full substring match → strong fill; else bounded word-overlap opacity. | Text remains readable (`opacity` capped). |
| **REQ-DM-4** | `.entity-name`: value variants (space `.` `_` `-` collapsed) in haystack → verified icon + label-specific tooltip. | Skips rows without `:` safely. |
| **REQ-DM-5** | When row has visible **Save** and no `Performer:` entity under `.mt-2`, add **QA warning** outline on the scene row. | Uses resilient Save discovery (not a single long concatenated class string). |

## Overlap note

Legacy `highlightFingerprints.js` duplicates part of `DataMatches.js`. The plugin implements **one** fingerprint pipeline (REQ-FP-*), toggled by `enableFingerprintQuality`.

## Non-goals (v1)

- Changing stash-box scoring or persisted metadata.
- Full parity on non-scene taggers without a follow-up DOM spec.
