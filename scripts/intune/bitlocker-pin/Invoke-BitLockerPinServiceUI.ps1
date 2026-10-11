#Requires -Version 5.1
<# .SYNOPSIS
    SYSTEM task wrapper; shows a prompt only on a single console desktop.
#>
[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
function Test-ServiceUISession {
    param([long]$ConsoleSessionId, [object[]]$ExplorerProcesses, [object[]]$TrayProcesses)
    # Restrict this tutorial to one console desktop; refuse additional Explorer processes.
    return $ConsoleSessionId -gt 0 -and $ConsoleSessionId -ne [uint32]::MaxValue -and
        $ExplorerProcesses.Count -eq 1 -and $ExplorerProcesses[0].SessionId -eq $ConsoleSessionId -and
        @($TrayProcesses | Where-Object SessionId -eq $ConsoleSessionId).Count -gt 0
}
if ($MyInvocation.InvocationName -eq '.') { return }
try {
    if ([Security.Principal.WindowsIdentity]::GetCurrent().User.Value -ne 'S-1-5-18') { throw 'Launcher requires SYSTEM.' }
    if (-not [Environment]::Is64BitProcess) { throw 'Use native 64-bit PowerShell.' }
    $config = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'Pilot.json') -Raw | ConvertFrom-Json
    . (Join-Path $PSScriptRoot 'ServiceUIValidation.ps1')
    $serviceUI = Join-Path $PSScriptRoot 'ServiceUI.exe'
    Assert-ServiceUIBinary -Path $serviceUI
    Import-Module (Join-Path $PSScriptRoot 'BitLockerPin.psm1') -Force
    $volume = Get-BitLockerVolume -MountPoint $env:SystemDrive
    if (Test-PinEnrollmentComplete -Volume $volume) { exit 0 }
    $ready = & (Join-Path $PSHOME 'powershell.exe') -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'Test-PostProvisioningRequirement.ps1')
    if ($ready -ne 'True') { exit 0 }
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class PinConsoleSession {
    [DllImport("kernel32.dll")] public static extern uint WTSGetActiveConsoleSessionId();
}
'@
    $console = [PinConsoleSession]::WTSGetActiveConsoleSessionId()
    $explorer = @(Get-Process explorer -ErrorAction SilentlyContinue)
    $tray = @(Get-Process SecurityHealthSystray -ErrorAction SilentlyContinue)
    if (-not (Test-ServiceUISession -ConsoleSessionId $console -ExplorerProcesses $explorer -TrayProcesses $tray)) { exit 0 }
    $powerShell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    $interactive = '.\Start-BitLockerPinInteractive.ps1'
    # Only trusted local script paths cross the command line; never the PIN.
    Push-Location -LiteralPath $PSScriptRoot
    try {
        & $serviceUI ('-session:{0}' -f $console) $powerShell '-NoProfile' '-STA' '-ExecutionPolicy' 'Bypass' '-WindowStyle' 'Hidden' '-File' $interactive '-ExpectedSessionId' $console
        $resultCode = $LASTEXITCODE
    } finally { Pop-Location }
    if ($resultCode -ne 0) {
        $identifier = 'INTERACTIVE_FAILED'
        if ($resultCode -eq 1602) { $identifier = 'USER_CANCELLED' }
        try {
            ('{0:o} {1} ExitCode={2}' -f [DateTime]::UtcNow, $identifier, $resultCode) |
                Set-Content -LiteralPath (Join-Path $PSScriptRoot 'LastLauncherFailure.txt') -Encoding UTF8
        } catch { }
    }
    exit $resultCode
} catch {
    # Only a fixed state identifier is persisted; never exception text or PIN values.
    $identifier = 'LAUNCHER_FAILED'
    if ($_.Exception.Message -like 'PIN_PARTIAL_STATE:*') { $identifier = 'PIN_PARTIAL_STATE' }
    try {
        ('{0:o} {1}' -f [DateTime]::UtcNow, $identifier) |
            Set-Content -LiteralPath (Join-Path $PSScriptRoot 'LastLauncherFailure.txt') -Encoding UTF8
    } catch { }
    Write-Warning $identifier
    exit 1
}
