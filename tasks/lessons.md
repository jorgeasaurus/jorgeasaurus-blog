# Lessons

- For Intune remediation templates, write custom logs under `C:\ProgramData\Microsoft\IntuneManagementExtension\Logs` so collected Intune diagnostics include them.
- For React Doctor `js-tosorted-immutable`, keep `toSorted()` and use `"lib": ["ES2023"]` (valid since TS 5.2) instead of hand-rolled ambient `Array` augmentations; avoid broad `ESNext` libs unless the whole project intentionally targets future APIs. The "ES2023 invalid" diagnostics come from the Microsoft Edge Tools (webhint) extension's stale tsconfig schema — silenced in `.hintrc`, not a real error.
- Keep component-specific visual tuning out of shared CSS selectors; put nav-only glass changes on `.topbar` overrides, not shared glass panel rules.
- When matching a visual reference, inspect the reference first and verify the rendered output for text/icon collisions before marking it done.
- On the projects page, prefer a project’s public site URL over its GitHub repository URL when a live site exists.
- On the projects page, place public web apps/sites in the Live projects section instead of leaving them under repos.
