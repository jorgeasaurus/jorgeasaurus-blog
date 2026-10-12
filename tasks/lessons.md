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
- If repeated glass cards still look clear, prefer CSS tint/overlay adjustments over per-card liquid-glass canvases to avoid too many WebGL contexts.
- When the user asks for glass blur consistency, use a shared CSS filter token before tuning individual surfaces by eye.
- When matching card styles, compare the browser-computed runtime surface, including liquid-glass classes, not only the fallback CSS block.
- Do not use DOM snapshot libraries like `html2canvas` for always-on production glass effects; native CSS backdrop-filter avoids console noise, `document.write`, and heavy bundle cost.
- When adding caveats to a technical post, update the examples in the same pass so snippets do not contradict the new guidance; dry-run paths must not report real changes.
- For idempotence guidance, separate repeat-run safety from concurrency safety and report dry-run results as `WouldChange`, not generic skipped work.
- For opt-in/signup UI on this blog, place the signup at the bottom of the reading/listing flow unless the user explicitly asks for an above-the-fold capture surface.
- For newsletter signup alignment, keep the input and submit button on explicit matching control heights and verify their rendered bounding boxes on desktop and mobile.
- When removing a post, remove metadata, MDX source, social assets, and regenerated feed/sitemap references together.
- When researching tutorial/resource sentiment, confirm whether the user wants learning resources or blog-post ideas before ranking external tutorials.
- For newsletter controls, put the input and submit button inside the same row container instead of aligning a standalone button against a label+input grid item.
- In email templates, keep brand prompt marks and wordmarks in a no-wrap unit so narrow clients do not split the logo from the name.
- When the user references Resend template creation, use the Resend Templates API and SDK pattern instead of treating "template" as only a local HTML renderer.
- For project social cards, make the actual product/page the first visual signal; do not bury screenshots under oversized dark panels or heavy overlays.
- When unignoring one repo-local skill under `.agents`, keep the broad `.agents/*` ignore and add targeted negations; verify unrelated `.agents/*` folders stay ignored before finishing.
- For post dates, use the shared date helper and never parse date-only strings with raw `new Date('YYYY-MM-DD')`; timezone conversion can shift the displayed day.
- Keep Resend access behind the shared SDK helper instead of mixing raw REST calls with SDK calls across scripts and API functions.
- Keep GitHub Actions as orchestration; move non-trivial Node logic into checked scripts and verify the workflow calls those scripts.
- When multiple Node scripts need flags or `.env.local`, add or reuse `scripts/lib/cli.mjs`; do not copy CLI boilerplate across scripts.
- Resend duplicate-resource predicates must be specific; never treat every `400` or generic `exist` text as success because validation and missing-resource failures can otherwise be hidden.
- When a workflow polls production URLs, follow redirects or use the exact canonical host; `curl` without `-L` can fail against apex-to-www redirects even when the page is live.
- Do not reuse "boring on purpose" as a default blog-post thesis; choose wording specific to the project and delete repeated stock phrases.
- When asked for "main plus one post," restore and preserve main's complete content set, then add only that post; never reinterpret existing published posts as drafts.
- Before creating a blog social card, inspect existing post cards and match their branding, layout, typography, and palette; do not invent a separate editorial style.
- Apply ASD-STE100 Simplified Technical English and the Google developer documentation style guide to all blog drafts and edits. These standards override conflicting voice guidance.
- For assignment-post comparisons, use images with clear grid lines when requested. Preserve equivalent text and verify image expansion on mobile.

- For Windows PowerShell 5.1 deliverables, save scripts/modules/XAML as UTF-8 with BOM and read XAML with explicit UTF8 encoding. Verify with Windows PowerShell 5.1, including the packaged local-check script.

- Resolve defaults based on PSScriptRoot in the script body after parameter binding, not in parameter default expressions; test the actual entry command without optional arguments.

- Inspect high-level BitLocker cmdlet side effects before claiming staged protector removal. Provide non-secret error IDs/codes and permit closing failed enrollment without reporting success.

- Provide Cancel before PIN submission. Separate installed prompt infrastructure from PIN completion; a required Intune assignment alone does not guarantee a prompt at next sign-in.

- Explain session 0 visibility and the interactive task boundary explicitly. Do not list ServiceUI as a dependency of a package that does not use it; verify current Microsoft support guidance.

- Standard-user enrollment is a core acceptance criterion for Autopilot PIN workflows. Do not substitute an administrator-only pilot; implement the requested privilege/session bridge and label unsupported dependencies accurately.

- Forward nested PowerShell script exit codes explicitly. Presence of TpmPin alone is insufficient completion evidence when TPM-only protection can remain after a failed transaction.

- For this post, use an image-generated graphic for the logo requirements table, as requested; retain the requirements in alternative text.
- All tables in the BitLocker PIN post must be image-generated graphics, with accurate settings preserved in alt text.
- Keep the ASCII-only Intune requirement script BOM-free. A BOM may appear as ï»¿ when read or copied through an ANSI editor. Preserve UTF-8 BOM only where non-ASCII Windows PowerShell text needs it.

- When accepting user-reported ARM64 testing, update Intune eligibility and runtime guards together; do not leave the installer rejecting an eligible architecture.

- For enrollment apps, agree on Installed semantics: detect the completed protected enrollment, not only staged infrastructure.

- Required PIN enrollment needs completion-based detection and persistent prompting; an Available launcher assignment does not fulfill that workflow.

- Never combine asynchronous prompt staging with completion-based Intune detection. Wait for enrollment in the installer before reporting success.
- Reimage testing must validate policy bootstrap, not reuse an already protected prior OS state.

- Keep ServiceUI setup simple: do not require a SHA256 parameter when the operator supplies the executable. Retain executable and architecture validation.

- For package deployment posts, keep only prerequisites, required settings, commands and validation. Put diagnostic detail in the repository guide.

- When a parameter is removed, audit all reader-facing copies, desktop notes and archived ZIPs, not just runtime scripts and the post.

- Do not describe a manual acknowledgment switch as recovery-key validation. Keep required device-state checks separate from operator review.

- Interpret whether a supplied policy is sufficient in the deployment context: check policy coverage alongside the app, rather than whether policy replaces the app.

- For Intune console import requests, provide Settings Catalog JSON and console steps, not Graph creation scripts. Silent encryption and PIN enrollment need separate, non-overlapping startup-policy stages.

- Keep the privileged enrollment console hidden without suppressing WPF. Treat missing Parallels Tools as an unverified hypothesis; VM preboot errors do not prove physical-device behavior.

- Keep the BitLocker post consistent with the selected single-policy workflow. Explain its validation limits without inserting an unsolicited two-policy deployment procedure.

- Explain BitLocker policy conflicts separately from app desktop readiness. Connect each prerequisite to the behavior it enables; remove stale references to two policies.

- A maximized WPF window does not ensure its form fits. Scale the form to the available viewport; avoid ScrollViewer for the full-screen enrollment flow.
