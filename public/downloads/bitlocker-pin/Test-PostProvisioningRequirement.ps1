#Requires -Version 5.1
<#
.SYNOPSIS
    Intune Win32 requirement: Boolean Equals True; run as SYSTEM in 64-bit PowerShell.
.DESCRIPTION
    Fail closed unless OOBE is complete, setup is inactive, and Explorer and
    SecurityHealthSystray run in the same interactive session. Tray presence is
    a heuristic, not a supported ESP completion API. Validate in your tenant.
#>
[CmdletBinding()]
param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
function Test-DesktopReadiness {
    param(
        [bool]$OobeComplete,
        [int]$SystemSetupInProgress,
        [int]$OobeInProgress,
        [object[]]$ExplorerProcesses,
        [object[]]$TrayProcesses
    )
    if (-not $OobeComplete -or $SystemSetupInProgress -ne 0 -or $OobeInProgress -ne 0) { return $false }
    $sessions = @($ExplorerProcesses | Where-Object { $_.SessionId -gt 0 } | Select-Object -ExpandProperty SessionId -Unique)
    return @($TrayProcesses | Where-Object { $_.SessionId -gt 0 -and $_.SessionId -in $sessions }).Count -gt 0
}
# Dot-source to test the pure readiness predicate without reading device state.
if ($MyInvocation.InvocationName -eq '.') { return }
$ready = $false
try {
    if ($env:OS -ne 'Windows_NT') { throw 'Windows required.' }
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class PinPilotOobe {
    [DllImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool OOBEComplete([MarshalAs(UnmanagedType.Bool)] out bool complete);
}
'@
    $complete = $false
    if (-not [PinPilotOobe]::OOBEComplete([ref]$complete)) { throw 'OOBE state unavailable.' }
    $setup = Get-ItemProperty -LiteralPath 'HKLM:\SYSTEM\Setup'
    $parameters = @{
        OobeComplete = $complete
        SystemSetupInProgress = $setup.SystemSetupInProgress
        OobeInProgress = $setup.OOBEInProgress
        ExplorerProcesses = @(Get-Process -Name explorer -ErrorAction SilentlyContinue)
        TrayProcesses = @(Get-Process -Name SecurityHealthSystray -ErrorAction SilentlyContinue)
    }
    $ready = Test-DesktopReadiness @parameters
} catch { $ready = $false }
# Requirement scripts must not emit diagnostic text to stdout.
Write-Output $ready
exit 0
