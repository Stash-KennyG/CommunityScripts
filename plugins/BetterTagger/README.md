# BetterTagger

Native Stash UI plugin for the **scene list tagger** (stash-box triage). It replaces three Tampermonkey scripts with one implementation driven by explicit requirements in [`REQUIREMENTS.md`](./REQUIREMENTS.md).

## Install

Copy this folder into your Stash plugins directory (or install from the CommunityScripts repo), enable the plugin in **Settings → Plugins**, then reload the UI.

## Settings

| Setting | Default | REQ group |
|---------|---------|-----------|
| `enableFingerprintQuality` | on | REQ-FP-* |
| `enableSaveLayout` | on | REQ-SAVE-* |
| `enableMetadataMatchHints` | on | REQ-DM-1–4 |
| `enableMissingPerformerQA` | on | REQ-DM-5 |
| `enableSceneFileInfo` | on | Scene drawer enrichment |
| `enableSceneBadges` | on | Scene badge overlay |

## Migration from Tampermonkey

Disable **Stash Save Button Position Fix**, **Data Matches for StashResults**, and **highlightFingerprints** (or your renamed copies). Legacy sources are kept under [`legacy-tampermonkey/`](./legacy-tampermonkey/) for provenance only.

## Integration

See [`INTEGRATION.md`](./INTEGRATION.md). v1 uses a **scoped DOM adapter** (debounced `MutationObserver` on `.tagger-container`) plus `PluginApi.Event` `stash:location` for teardown. Stash `develop` now registers **`Tagger`**, **`TaggerScene`**, and **`StashSearchResult`** as patchable component names so a future revision can move logic to `PluginApi.patch.*` without scraping text.

## i18n caveat (Save)

Save detection uses `trim() === "Save"` like the legacy script. Non-English UI labels for `actions.save` will **not** match until a follow-up resolves the message via locale APIs.

## Manual QA matrix

| Case | Expected |
|------|----------|
| Scenes → Tagger with stash-box results | Fingerprint % + colors on `N / M fingerprints` lines; optional fields / entities reflect title + query haystack |
| Active result with Save | Save row sits at bottom of right column; turning off `enableSaveLayout` removes flex classes |
| Active result, no `Performer:` in `.mt-2` | Red outline on outer `div.mt-3.search-item` when `enableMissingPerformerQA` is on |
| Drawer expanded in scene tagger | File Info block shows hashes/path/size/modtime/duration/dimensions/framerate/bitrate/codecs when `enableSceneFileInfo` is on |
| Scene row headline area | Badge chips show playcount, markers, groups, O-count, organized status when `enableSceneBadges` is on |
| Navigate away from tagger | No observer leak; no leftover `data-bt-*` styling on unrelated pages |
| Rapid result switch / search refresh | No duplicate `%` fragments; fingerprint suffix lives in `.bt-fp-pct` only |
| Tag / studio / performer tagger | No console errors; scene-specific selectors (`div.mt-3.search-item`) typically no-op |

## Stash version

Fingerprint regex and DOM selectors target current `stashapp` scene tagger markup. Pin your Stash version when reporting issues.
