# Lessons

- For Intune remediation templates, write custom logs under `C:\ProgramData\Microsoft\IntuneManagementExtension\Logs` so collected Intune diagnostics include them.
- For React Doctor `js-tosorted-immutable`, keep `toSorted()` and add a narrow ambient declaration when config schemas reject `ES2023`; avoid broad `ESNext` libs unless the whole project intentionally targets future APIs.
- Keep component-specific visual tuning out of shared CSS selectors; put nav-only glass changes on `.topbar` overrides, not shared glass panel rules.
