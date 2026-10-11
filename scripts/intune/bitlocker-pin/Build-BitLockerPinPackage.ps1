#Requires -Version 5.1
<#
.SYNOPSIS
Packages the BitLocker PIN app using an operator-supplied Win32 Content Prep Tool.
.EXAMPLE
.\Build-BitLockerPinPackage.ps1 -ContentPrepToolPath C:\Tools\IntuneWinAppUtil.exe -OutputDirectory C:\Packages\BitLockerPin
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$ContentPrepToolPath,
    [string]$ServiceUIPath,
    [Parameter(Mandatory)][string]$OutputDirectory,
    [ValidateNotNullOrEmpty()][ValidatePattern('^[^"\r\n]+$')][string]$CompanyName = 'Your company'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'Run this packaging script on Windows.' }
if (-not $ServiceUIPath) { $ServiceUIPath = Join-Path $PSScriptRoot 'ServiceUI.exe' }
$tool = Get-Item -LiteralPath $ContentPrepToolPath -ErrorAction Stop
$binary = Get-Item -LiteralPath $ServiceUIPath -ErrorAction Stop
foreach ($item in @($tool, $binary)) {
    if ($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Dependencies must be regular executable files.' }
    if ($item.Extension -ne '.exe') { throw 'Supply executable dependency paths.' }
}
# Packaging can run on ARM64; the deployment still targets x64 and ARM64 Windows.
$stream = [IO.File]::OpenRead($binary.FullName)
$reader = New-Object IO.BinaryReader $stream
try {
    if ($reader.ReadUInt16() -ne 0x5A4D) { throw 'Invalid ServiceUI executable.' }
    $stream.Position = 0x3C
    $offset = $reader.ReadInt32()
    if ($offset -lt 64 -or $offset -gt ($stream.Length - 6)) { throw 'Invalid ServiceUI PE header.' }
    $stream.Position = $offset
    if ($reader.ReadUInt32() -ne 0x4550 -or $reader.ReadUInt16() -ne 0x8664) { throw 'Supply x64 ServiceUI.exe.' }
} finally { $reader.Dispose(); $stream.Dispose() }
$files = @('Install-BitLockerPin.ps1','Uninstall-BitLockerPin.ps1','Test-BitLockerPinInstalled.ps1','Test-PostProvisioningRequirement.ps1','PinWindow.xaml','generic-logo.png')
foreach ($name in $files) {
    if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot $name) -PathType Leaf)) { throw "Missing source file: $name" }
}
$output = [IO.Path]::GetFullPath($OutputDirectory)
$source = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\') + '\'
if (($output.TrimEnd('\') + '\').StartsWith($source, [StringComparison]::OrdinalIgnoreCase)) { throw 'OutputDirectory must be outside the source folder.' }
# Each run gets a separate output folder; quiet mode cannot overwrite a previous build.
$run = Join-Path $output ('BitLockerPin-' + [Guid]::NewGuid().ToString('N'))
$stage = Join-Path ([IO.Path]::GetTempPath()) ('BitLockerPin-stage-' + [Guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $run, $stage
try {
    foreach ($name in $files) { Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination $stage }
    Copy-Item -LiteralPath $binary.FullName -Destination (Join-Path $stage 'ServiceUI.exe')
    & $tool.FullName -c $stage -s 'Install-BitLockerPin.ps1' -o $run -q
    if ($LASTEXITCODE -ne 0) { throw "Content Prep Tool failed: $LASTEXITCODE" }
    $package = Join-Path $run 'Install-BitLockerPin.intunewin'
    if (-not (Test-Path -LiteralPath $package -PathType Leaf) -or (Get-Item -LiteralPath $package).Length -eq 0) { throw 'Content Prep Tool did not produce a package.' }
    foreach ($name in @('Test-BitLockerPinInstalled.ps1','Test-PostProvisioningRequirement.ps1')) {
        Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination $run
    }
    $instructions = @"
Install behavior: System
Architecture: x64; add ARM64 only after validating x64 ServiceUI emulation
Assignment: Required; pilot group
Install command:
%SystemRoot%\Sysnative\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Install-BitLockerPin.ps1 -ServiceUIPath .\ServiceUI.exe -CompanyName "$CompanyName"
Uninstall command:
%SystemRoot%\Sysnative\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Uninstall-BitLockerPin.ps1
Detection: Test-BitLockerPinInstalled.ps1; 32-bit execution disabled
Requirement: Test-PostProvisioningRequirement.ps1; SYSTEM, 64-bit; Boolean Equals True
Verify independent recovery-key access before deployment.
ServiceUI interaction is unsupported. Test standard-user enrollment before rollout.
This private .intunewin contains ServiceUI; do not publish it with the blog ZIP.
"@
    Set-Content -LiteralPath (Join-Path $run 'Intune-settings.txt') -Value $instructions -Encoding UTF8
    Get-Item -LiteralPath $package
} finally {
    Remove-Item -LiteralPath $stage -Recurse -Force
}
