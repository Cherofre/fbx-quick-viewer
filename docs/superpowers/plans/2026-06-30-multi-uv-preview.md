# Multi UV Preview Planning Notes

## Goal

Add a future UV channel inspection feature for FBX assets with multiple UV sets.

## Desired Behavior

- Detect UV channels from the currently loaded model only; do not parse every FBX in a large folder just to show metadata.
- Show only channels that actually exist on the current model, such as `UV1`, `UV2`, or more if the loader exposes them.
- Do not show `UV2` when the loaded model has no second UV set.
- Let the UV layout preview draw the selected channel.
- Let texture preview use the selected channel, so dragged textures can be inspected against UV2/lightmap/AO layouts.
- Show UV capability in the model preview stats, for example `UV: UV1, UV2` or `UV: UV1, UV2(partial)`.
- Show a lightweight `UV2` or `UV2*` badge next to model names only after that model has already been parsed by preview or thumbnail generation.

## Implementation Direction

- Build a helper that inspects `geometry.attributes.uv`, `uv2`, and any additional UV-like attributes exposed by `FBXLoader`.
- Keep the UV channel selector dynamic per loaded model.
- Cache original `geometry.attributes.uv` before temporary preview substitution.
- For texture preview, switch the active preview channel by temporarily assigning the selected UV attribute to `geometry.attributes.uv`, then restore the original channel when leaving UV preview or loading another model.
- Avoid persistent UV metadata cache in the first pass; in-memory metadata is enough until the interaction is proven.

## Open Questions

- Confirm how the current vendored `FBXLoader` names UV sets beyond `uv2`.
- Decide whether partial UV2 should mean "some meshes have UV2" or "all visible/material meshes have UV2".
- Decide whether badges should appear in list view, grid view, or both.
