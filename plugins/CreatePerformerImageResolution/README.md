# Create Performer Image Resolution

Adds an intrinsic image resolution line to SceneTagger's **Create Performer** dialog.

## What it does

- Detects the selected performer image in the Create Performer modal.
- Displays the image intrinsic size as `WIDTH x HEIGHT`.
- Renders the value directly beneath the **Select performer image** label.

![Example](example.png)

## Notes

- The value reflects the selected image's intrinsic dimensions (`naturalWidth`/`naturalHeight`).
- Styling inherits from the existing label for a native look and feel.
