# BetterTagger — integration tiers

This plugin follows [Stash UI plugins](https://github.com/stashapp/stash/blob/develop/ui/v2.5/src/docs/en/Manual/Plugins.md) packaging and the [UI Plugin API](https://github.com/stashapp/stash/blob/develop/ui/v2.5/src/docs/en/Manual/UIPluginApi.md).

## Tier 0 (always)

| Concern | Mechanism |
|--------|-----------|
| Load / ordering | `BetterTagger.yml` `ui.javascript`, `ui.css` |
| Lifecycle | `window.PluginApi.Event.addEventListener("stash:location", …)` to attach when entering tagger routes and **detach** observers when leaving |
| Settings | GraphQL `configuration { plugins }` → `BetterTagger` keys |

## Tier A — `PluginApi.patch.*` (upstream-enabled)

Official patchable names live in `UIPluginApi.md` under **Patchable components and functions**.

| Feature | Ideal patch target | Status in this repo |
|--------|--------------------|---------------------|
| REQ-FP / REQ-DM props | `StashSearchResult`, `TaggerScene`, scene `Tagger` | **PatchComponent names added** in stash `ui/v2.5` so plugins *may* migrate to props-driven UI later. The shipped BetterTagger v1 still uses **Tier B** for DOM/CSS speed of delivery. |
| REQ-SAVE | Layout wrapper in React | Still solvable in CSS + Tier B; optional future `patch.after` wrapper. |

### Gap that was closed upstream

`Tagger`, `TaggerScene`, and `StashSearchResult` were **not** listed as patchable; they are **registered** now (see stash PR in same changeset) and documented in `UIPluginApi.md`.

## Tier B — DOM adapter (plugin v1 default)

| Concern | Mechanism |
|--------|-----------|
| REQ-FP / REQ-DM / REQ-SAVE / REQ-DM-5 | Single debounced `MutationObserver` on **`.tagger-container`** subtree only (not `document.body`) |
| Idempotency | `data-bt-*` markers; fingerprint `%` in `.bt-fp-pct` child, never rewriting whole `textContent` |
| Parsing | Selectors centralized at top of `BetterTagger.js`; logic delegated to `BetterTaggerCore.js` |

When Tier A patches are used by a future revision, the DOM adapter should shrink to a compatibility fallback only.
