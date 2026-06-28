# Lessons

- For Intune remediation templates, write custom logs under `C:\ProgramData\Microsoft\IntuneManagementExtension\Logs` so collected Intune diagnostics include them.
- For React Doctor `js-tosorted-immutable`, keep `toSorted()` and use `"lib": ["ES2023"]` (valid since TS 5.2) instead of hand-rolled ambient `Array` augmentations; avoid broad `ESNext` libs unless the whole project intentionally targets future APIs. The "ES2023 invalid" diagnostics come from the Microsoft Edge Tools (webhint) extension's stale tsconfig schema — silenced in `.hintrc`, not a real error.
- Keep component-specific visual tuning out of shared CSS selectors; put nav-only glass changes on `.topbar` overrides, not shared glass panel rules.
- When matching a visual reference, inspect the reference first and verify the rendered output for text/icon collisions before marking it done.
- On the projects page, prefer a project’s public site URL over its GitHub repository URL when a live site exists.
- On the projects page, place public web apps/sites in the Live projects section instead of leaving them under repos.
- Before replacing the glass UI system, compare against production screenshots and reject changes that look visually worse.
- When asked to apply a design prompt to this blog, preserve the existing blog content, routes, and identity unless a replacement page is explicitly requested.
- When the user asks to move work back to `main`, preserve current branch changes first, switch branches cleanly, and keep the new diff scoped to the requested change.
- For homepage hero placement tweaks, adjust the title block independently from the intro block so user-directed title movement does not undo the lower-right intro placement.
- Keep the homepage hero at the origin/main content width unless the user explicitly asks for a wider panel; solve title/intro collisions with vertical placement first.
- When increasing the homepage hero wordmark size, lift the title block in the same change and verify desktop overlap against the lower-right intro.
- When matching card glass treatments, confirm which reference surface the user means and compare the complete computed backdrop-filter tuple, not just the blur radius.
