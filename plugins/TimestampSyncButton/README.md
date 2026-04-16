# Timestamp Sync Button

Manual scene-marker sync from [timestamp.trade](https://timestamp.trade/) with a Scene page button.

## What this fork changes

- Runs only when you click a button on the Scene page Markers tab.
- Does not use Scene/Gallery/Image hooks.
- Adds optional `Auto-create tags` setting (default off).
- Logs unmatched marker tags to the Stash log when auto-create is disabled.

## Button location

- Scene page -> `Markers` tab -> next to `Create Marker`.
- Button label: `Sync`
- Tooltip: `Sync Timestamps from timestamp.trade`

## Settings

- `Auto-create tags` (default off)
  - When enabled, missing marker tags can be created during import.
  - When disabled, markers with unknown tags are skipped and logged.
- `Add timestamp.trade url`
- `Add markers from timestamp.trade`
- `Add the [Timestamp] tag to created markers`
- `Add TsTrade to marker titles`
- `Exclude markers containing these words`
- `Overwrite markers`
- `Merge markers`

## Task

- `Sync Scene`
  - Runs `processScene` for the selected scene id passed by the UI button.