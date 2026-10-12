# BitLocker startup PIN troubleshooting

Enrollment log: `C:\ProgramData\Microsoft\IntuneManagementExtension\Logs\BitLockerPinEnrollment.log`. Includes UTC timestamps, process/session IDs, stages, sanitized errors, and exit codes. Rotates at 2 MB to `.log.1`; excludes PINs and recovery keys.

## BitLocker returns 0x803100B5

This error means `FVE_E_NO_PREBOOT_KEYBOARD_DETECTED`. Windows did not detect the required preboot input capability. [Microsoft: COM error codes](https://github.com/MicrosoftDocs/win32/blob/docs/desktop-src/com/com-error-codes-6.md).

Our Parallels VM reported slate mode and initially rejected TPM+PIN creation. The TPM-only and recovery protectors remained intact.

1. On Parallels, check Tools and Windows updates. In our ARM64 test, installing Tools and restarting did not resolve this error; Windows still reported slate mode.
2. Verify that keyboard input works in the firmware environment.
3. Confirm that you can retrieve the recovery key.
4. Enable the slate preboot input setting only for that verified hardware group.
5. Synchronize the device.
6. Confirm the effective setting is `1`.

```powershell
Get-ItemPropertyValue 'HKLM:\SOFTWARE\Policies\Microsoft\FVE' `
    -Name OSEnablePrebootInputProtectorsOnSlates
```

7. Retry enrollment.
8. Verify actual PIN entry after restart.

The exception permits input-dependent authentication. It does not add keyboard support or make the Windows touch keyboard available before boot.

Do not enable it globally or change it automatically from the enrollment script. [Microsoft: BitLocker preboot input policy](https://learn.microsoft.com/en-us/windows/security/operating-system-security/data-protection/bitlocker/configure).

## The script cannot find its logo path

An earlier build evaluated `Join-Path $PSScriptRoot` inside the parameter defaults. That produced an empty-path error on Windows PowerShell 5.1.

The current installer resolves its asset paths after parameter binding. Keep the installer, XAML, and image together.

## ServiceUI is missing or the prompt never appears

Confirm that the approved executable was included before packaging. Confirm that it is the reviewed x64 build. The ARM64 pilot uses x64 emulation and requires separate validation.

Check the active console session, Explorer, and Windows Security tray process. The installer selects the active console and checks its desktop processes before showing the privileged prompt.

Keep staged scripts writable only by SYSTEM and administrators. Inspect the current install result and preflight failure code:

```powershell
Get-Content 'C:\Program Files\BitLockerPin\LastInstallResult.txt' -ErrorAction SilentlyContinue
Get-Content 'C:\Program Files\BitLockerPin\LastPreflightFailure.txt' -ErrorAction SilentlyContinue
```

The result records `STARTING`, `COMPLETED`, `CANCELLED`, or `FAILED` with a timestamp and exit code. It contains no PIN or recovery password. An old preflight record may describe a previous attempt; compare timestamps.

## The editor reports an unsupported encoding

Extract the ZIP instead of opening the ZIP as text. The UI scripts and XAML use UTF-8 with a byte-order mark for Windows PowerShell 5.1. The ASCII-only requirement script has no BOM.

The script also reads XAML with explicit UTF-8 encoding. Recheck encoding if an editor rewrites the files.

## The prompt fails or the requirement stays false

Confirm the Intune app uses SYSTEM install behavior. Check effective startup policy, TPM state, drive protection, and recovery-key availability. The UI reports a nonsecret error identifier or native BitLocker code.

Inspect **Microsoft-Windows-BitLocker-API/Management** in Event Viewer when the native operation fails. [Microsoft: Troubleshoot BitLocker policies](https://learn.microsoft.com/en-us/troubleshoot/mem/intune/device-protection/troubleshoot-bitlocker-policies).

For a false requirement, check OOBE/setup state and the two processes’ session IDs. Check the Windows Security tray policy before removing readiness checks.

If failure occurs after a protector change, inspect the actual protector state before restarting or retrying. Close failed setup instead of repeatedly submitting a PIN.

## Change PIN still requires administrator credentials

Sync the device after disabling **Disallow standard users from changing the PIN or password**. Check for another policy that enables the same restriction.

Inspect `DisallowStandardUserPINReset` under `HKLM:\SOFTWARE\Policies\Microsoft\FVE`. A value of `1` blocks standard-user PIN changes.

Test **Change PIN** with a standard account and the current PIN. A forgotten PIN still requires IT assistance; this setting does not permit recovery without the current PIN.

## Preflight failure codes

If preflight fails, the prompt shows a closable failure screen before PIN entry. Check `C:\Program Files\BitLockerPin\LastPreflightFailure.txt` for the last failure code and timestamp. `BITLOCKER_NOT_READY` means the drive is not an unlocked, fully encrypted OS drive. `BITLOCKER_NOT_PROTECTED` means protection is off or a later readiness check failed. `PROTECTOR_STATE_INVALID` means the expected TPM-only and recovery protectors are missing or other protector types exist. Inspect actual protector state: optional recovery-only initialization may have added TPM protection before a later check failed.

## Fully encrypted, recovery-only drive with protection off

For this specific pre-provisioned state, append `-InitializeRecoveryOnly` to the install command. The installer backs up recovery protectors to Entra, adds TPM protection, verifies protection, then prompts for a PIN.

Do not use this option for maintenance suspension. The installer will not automatically resume a suspended drive with an existing TPM protector.
