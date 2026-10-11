#Requires -Version 5.1
# Pure bootstrap fixtures. No device state is read or modified.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Install-BitLockerPin.ps1') -InitializeRecoveryOnly
$originalDrive = $env:SystemDrive
$env:SystemDrive = 'C:'
function New-FixtureVolume {
    param([string]$Protection = 'Off', [string]$Status = 'FullyEncrypted', [string[]]$Types = @('RecoveryPassword'))
    $keys = foreach ($type in $Types) { [pscustomobject]@{ KeyProtectorType = $type; KeyProtectorId = $type } }
    [pscustomobject]@{ VolumeType = 'OperatingSystem'; LockStatus = 'Unlocked'; VolumeStatus = $Status; ProtectionStatus = $Protection; KeyProtector = @($keys) }
}
function Get-BitLockerVolume { param($MountPoint) $script:volume }
function Get-ItemProperty { param($Path) [pscustomobject]@{ UseAdvancedStartup = 1; UseTPM = 2; UseTPMPIN = $script:pinPolicy } }
function Get-Tpm { [pscustomobject]@{ TpmPresent = $true; TpmReady = $true } }
function BackupToAAD-BitLockerKeyProtector {
    param($MountPoint,$KeyProtectorId,$ErrorAction)
    if ($script:backupFails) { throw 'RECOVERY_BACKUP_FAILED' }
    $script:backups++
}
function Get-CimInstance { param($Namespace,$ClassName) [pscustomobject]@{ DriveLetter = 'C:' } }
function Invoke-CimMethod {
    param($InputObject,$MethodName,$Arguments,$Confirm,$ErrorAction)
    if ($MethodName -in @('IsEnabled','IsActivated','IsOwned')) { return @{ ReturnValue = 0; $MethodName = $true } }
    if ($script:backups -lt 1) { throw 'Backup must precede protector creation.' }
    $script:created++
    $script:volume = New-FixtureVolume -Types @('RecoveryPassword','Tpm')
    if ($script:badReadback) { $script:volume = New-FixtureVolume -Types @('Tpm') }
    [pscustomobject]@{ ReturnValue = 0 }
}
function Resume-BitLocker { param($MountPoint,$ErrorAction) $script:resumed++; $script:volume = New-FixtureVolume -Protection On -Types @('RecoveryPassword','Tpm') }
$passed = 0
try {
    foreach ($case in @('Normal','Protected','Suspended','Encrypting','RequiredPIN','BackupFailure','InitializationNotAuthorized','BadReadback')) {
        $script:volume = New-FixtureVolume
        $script:pinPolicy = 2; $script:backupFails = $false; $script:badReadback = $false; $InitializeRecoveryOnly = $true
        $script:created = 0; $script:resumed = 0; $script:backups = 0
        switch ($case) {
            Protected { $script:volume = New-FixtureVolume -Protection On -Types @('RecoveryPassword','Tpm') }
            Suspended { $script:volume = New-FixtureVolume -Types @('RecoveryPassword','Tpm') }
            Encrypting { $script:volume = New-FixtureVolume -Status EncryptionInProgress }
            RequiredPIN { $script:pinPolicy = 1 }
            BackupFailure { $script:backupFails = $true }
            InitializationNotAuthorized { $InitializeRecoveryOnly = $false }
            BadReadback { $script:badReadback = $true }
        }
        $failed = $false
        try { Initialize-PinProtection } catch { $failed = $true }
        if ($case -eq 'Normal') {
            if ($failed -or $script:created -ne 1 -or $script:resumed -ne 1 -or $script:volume.ProtectionStatus -ne 'On') { throw "$case failed" }
        } elseif ($case -eq 'Protected') {
            if ($failed -or $script:created -or $script:resumed) { throw "$case failed" }
        } elseif ($case -eq 'BadReadback') {
            if (-not $failed -or $script:created -ne 1 -or $script:resumed) { throw "$case failed" }
        } elseif (-not $failed -or $script:created -or $script:resumed) { throw "$case failed" }
        $passed++
    }
    Write-Output "$passed synchronous install bootstrap fixtures passed."
} finally { $env:SystemDrive = $originalDrive }
