#Requires -Version 5.1
[CmdletBinding()]
param([Parameter(Mandatory)][ValidateRange(1,2147483647)][int]$ExpectedSessionId)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
# Verify the actual child token. ServiceUI must retain SYSTEM in the desktop session.
if ([Security.Principal.WindowsIdentity]::GetCurrent().User.Value -ne 'S-1-5-18') { throw 'ServiceUI did not retain SYSTEM.' }
if ([Diagnostics.Process]::GetCurrentProcess().SessionId -ne $ExpectedSessionId -or $ExpectedSessionId -le 0) { throw 'Unexpected interactive session.' }
$ready = & (Join-Path $PSHOME 'powershell.exe') -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'Test-PostProvisioningRequirement.ps1')
if ($ready -ne 'True') { exit 0 }
$explorer = @(Get-Process explorer -ErrorAction SilentlyContinue)
$tray = @(Get-Process SecurityHealthSystray -ErrorAction SilentlyContinue | Where-Object SessionId -eq $ExpectedSessionId)
if ($explorer.Count -ne 1 -or $explorer[0].SessionId -ne $ExpectedSessionId -or $tray.Count -eq 0) { exit 0 }
$config = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'Pilot.json') -Raw | ConvertFrom-Json
Import-Module (Join-Path $PSScriptRoot 'BitLockerPin.psm1') -Force
$volume = Get-BitLockerVolume -MountPoint $env:SystemDrive
if (Test-PinEnrollmentComplete -Volume $volume) { exit 0 }
& (Join-Path $PSScriptRoot 'Show-BitLockerPinEnrollment.ps1') -CompanyName $config.CompanyName

exit $LASTEXITCODE
