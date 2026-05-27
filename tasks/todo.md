# Reusable Intune Remediation Template

- [x] Add a concise tutorial post with detection and remediation templates.
- [x] Register the post in the blog content index.
- [x] Run lint/build verification.
- [x] Add explanatory comments to detection and remediation scripts.
- [x] Move template logs to the Intune Management Extension log directory.
- [x] Add remediation best-practice notes from current guidance.
- [x] Add official PsExec install link.
- [x] Create and register social card image.
- [x] Complete release review pass.
- [x] Add runnable detection and remediation scripts to the repo.
- [x] Link to the published IntuneScripts copies.

## Review

Added `reusable-intune-remediation-template` as a new MDX post, registered it in the post index, regenerated RSS through the production build, fixed date-only post formatting so Pacific time does not display posts one day early, added explanatory comments to the detection/remediation scripts, moved custom logs to the Intune Management Extension log directory, added remediation best-practice notes, linked to the official PsExec Sysinternals page, created a registered social card image, added runnable script files under `scripts/intune/remediations/reusable-template`, and linked to the published IntuneScripts copies. Release verification passed with `npm run lint`, `npm run build`, PowerShell script parsing, PowerShell snippet parsing, social metadata inspection, and a browser render check.
