#Requires -Version 5.1
<# .SYNOPSIS
    Intune detection: protected TPM+PIN enrollment. SYSTEM, 64-bit.
#>
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
try {
    $volume = Get-BitLockerVolume -MountPoint $env:SystemDrive -ErrorAction Stop
    $protectors = @($volume.KeyProtector)
    if ($volume.VolumeType -ne 'OperatingSystem' -or $volume.VolumeStatus -ne 'FullyEncrypted' -or
        $volume.ProtectionStatus -ne 'On' -or $volume.LockStatus -ne 'Unlocked' -or
        @($protectors | Where-Object KeyProtectorType -eq 'TpmPin').Count -ne 1 -or
        @($protectors | Where-Object KeyProtectorType -eq 'RecoveryPassword').Count -lt 1 -or
        @($protectors | Where-Object { $_.KeyProtectorType -notin @('TpmPin','RecoveryPassword') }).Count -gt 0) { exit 1 }
    Write-Output 'BitLocker startup PIN enrollment complete'
    exit 0
} catch { exit 1 }
