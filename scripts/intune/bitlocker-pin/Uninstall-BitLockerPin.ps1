#Requires -Version 5.1
<#
.SYNOPSIS
Returns the OS drive to TPM-only protection, then removes PIN prompting.
.DESCRIPTION
Run as SYSTEM. First change Intune startup authentication to allow TPM-only.
Recovery protectors and encryption are retained. Failure leaves prompting files
installed and requires IT inspection before restart.
#>
[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
function Remove-PilotStartupPin {
    param([Parameter(Mandatory)][string]$MountPoint)
    $volume = Get-BitLockerVolume -MountPoint $MountPoint -ErrorAction Stop
    $pins = @($volume.KeyProtector | Where-Object KeyProtectorType -eq 'TpmPin')
    if ($pins.Count -eq 0) { return }
    if ($volume.VolumeType -ne 'OperatingSystem' -or $volume.VolumeStatus -ne 'FullyEncrypted' -or
        $volume.LockStatus -ne 'Unlocked' -or $volume.ProtectionStatus -ne 'On') { throw 'Uninstall requires an unlocked, fully encrypted OS drive with protection On.' }
    if ($pins.Count -ne 1 -or @($volume.KeyProtector | Where-Object { $_.KeyProtectorType -notin @('TpmPin','Tpm','RecoveryPassword') }).Count) { throw 'Unexpected protector state; IT inspection required.' }
    $recoveryIds = @($volume.KeyProtector | Where-Object KeyProtectorType -eq 'RecoveryPassword' | Select-Object -ExpandProperty KeyProtectorId)
    if ($recoveryIds.Count -eq 0) { throw 'A recovery protector is required before removing the PIN.' }
    $policy = Get-ItemProperty -LiteralPath 'HKLM:\SOFTWARE\Policies\Microsoft\FVE' -ErrorAction SilentlyContinue
    if ($policy -and $policy.PSObject.Properties['UseAdvancedStartup'] -and $policy.UseAdvancedStartup -eq 1) {
        if (($policy.PSObject.Properties['UseTPMPIN'] -and $policy.UseTPMPIN -eq 1) -or
            ($policy.PSObject.Properties['UseTPM'] -and $policy.UseTPM -eq 0)) { throw 'Change Intune policy to allow TPM-only protection and sync before uninstall.' }
    }
    $tpms = @($volume.KeyProtector | Where-Object KeyProtectorType -eq 'Tpm')
    if ($tpms.Count -gt 1) { throw 'Unexpected TPM protector count.' }
    if ($tpms.Count -eq 0) {
        $cim = Get-CimInstance -Namespace 'root/cimv2/security/microsoftvolumeencryption' -ClassName Win32_EncryptableVolume -Filter ("DriveLetter='{0}'" -f $MountPoint) -ErrorAction Stop
        if (-not $cim) { throw 'OS volume CIM object unavailable.' }
        # Direct CIM creates the replacement without cmdlet-level protector removal.
        $result = Invoke-CimMethod -InputObject $cim -MethodName ProtectKeyWithTPM -Arguments @{ FriendlyName = 'BitLocker TPM-only' } -ErrorAction Stop
        if ($result.ReturnValue -ne 0) { throw ('TPM protector creation failed: 0x{0:X8}' -f [uint32]$result.ReturnValue) }
    }
    $beforeRemove = Get-BitLockerVolume -MountPoint $MountPoint -ErrorAction Stop
    $tpmIds = @($beforeRemove.KeyProtector | Where-Object KeyProtectorType -eq 'Tpm' | Select-Object -ExpandProperty KeyProtectorId)
    if ($tpmIds.Count -ne 1 -or $beforeRemove.ProtectionStatus -ne 'On' -or
        $pins[0].KeyProtectorId -notin @($beforeRemove.KeyProtector.KeyProtectorId) -or
        @($recoveryIds | Where-Object { $_ -notin @($beforeRemove.KeyProtector.KeyProtectorId) }).Count) { throw 'Replacement verification failed; PIN removal was not attempted.' }
    $null = Remove-BitLockerKeyProtector -MountPoint $MountPoint -KeyProtectorId $pins[0].KeyProtectorId -ErrorAction Stop
    $final = Get-BitLockerVolume -MountPoint $MountPoint -ErrorAction Stop
    if ($final.ProtectionStatus -ne 'On' -or $final.VolumeStatus -ne 'FullyEncrypted' -or
        @($final.KeyProtector | Where-Object KeyProtectorType -eq 'TpmPin').Count -ne 0 -or
        @($final.KeyProtector | Where-Object KeyProtectorType -eq 'Tpm').Count -ne 1 -or
        $tpmIds[0] -notin @($final.KeyProtector.KeyProtectorId) -or
        @($recoveryIds | Where-Object { $_ -notin @($final.KeyProtector.KeyProtectorId) }).Count) { throw 'Final verification failed; IT must inspect protectors before restart.' }
}
if ($MyInvocation.InvocationName -eq '.') { return }
if ([Security.Principal.WindowsIdentity]::GetCurrent().User.Value -ne 'S-1-5-18') { throw 'Run uninstall as SYSTEM.' }
if (-not [Environment]::Is64BitProcess) { throw 'Use native 64-bit Windows PowerShell.' }
$mutex = New-Object Threading.Mutex($false, 'Global\BitLockerPinEnrollment')
$ownsMutex = $false
try {
    try { $ownsMutex = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $ownsMutex = $true }
    if (-not $ownsMutex) { throw 'Enrollment is running. Close PIN setup before uninstall.' }
Remove-PilotStartupPin -MountPoint $env:SystemDrive
$folder = Join-Path $env:ProgramFiles 'BitLockerPin'
if (Test-Path -LiteralPath $folder) {
    $items = @(Get-Item -LiteralPath $folder) + @(Get-ChildItem -LiteralPath $folder -Force -Recurse)
    if (@($items | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }).Count) { throw 'Installation path contains a reparse point; cleanup stopped.' }
    Remove-Item -LiteralPath $folder -Recurse -Force
}

} finally {
    if ($ownsMutex) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
