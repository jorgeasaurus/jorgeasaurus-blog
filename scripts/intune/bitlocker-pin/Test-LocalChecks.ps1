#Requires -Version 5.1
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
foreach ($file in Get-ChildItem -LiteralPath $PSScriptRoot | Where-Object { $_.Extension -in @('.ps1','.psm1') }) {
    $tokens = $null
    $errors = $null
    $null = [Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$tokens, [ref]$errors)
    if ($errors.Count) { throw ($errors | Out-String) }
}
[xml]$xaml = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'PinWindow.xaml') -Raw -Encoding UTF8
. (Join-Path $PSScriptRoot 'Test-PostProvisioningRequirement.ps1')
$cases = @(
    @{ Name = 'Desktop ready'; Oobe = $true; Setup = 0; OobeFlag = 0; Explorer = @(1); Tray = @(1); Expected = $true },
    @{ Name = 'OOBE incomplete'; Oobe = $false; Setup = 0; OobeFlag = 0; Explorer = @(1); Tray = @(1); Expected = $false },
    @{ Name = 'Setup active'; Oobe = $true; Setup = 1; OobeFlag = 0; Explorer = @(1); Tray = @(1); Expected = $false },
    @{ Name = 'OOBE registry active'; Oobe = $true; Setup = 0; OobeFlag = 1; Explorer = @(1); Tray = @(1); Expected = $false },
    @{ Name = 'No tray'; Oobe = $true; Setup = 0; OobeFlag = 0; Explorer = @(1); Tray = @(); Expected = $false },
    @{ Name = 'No shell'; Oobe = $true; Setup = 0; OobeFlag = 0; Explorer = @(); Tray = @(1); Expected = $false },
    @{ Name = 'Different sessions'; Oobe = $true; Setup = 0; OobeFlag = 0; Explorer = @(1); Tray = @(2); Expected = $false },
    @{ Name = 'Session zero'; Oobe = $true; Setup = 0; OobeFlag = 0; Explorer = @(0); Tray = @(0); Expected = $false }
)
foreach ($case in $cases) {
    $argsForCase = @{
        OobeComplete = $case.Oobe
        SystemSetupInProgress = $case.Setup
        OobeInProgress = $case.OobeFlag
        ExplorerProcesses = @($case.Explorer | ForEach-Object { [pscustomobject]@{SessionId = $_} })
        TrayProcesses = @($case.Tray | ForEach-Object { [pscustomobject]@{SessionId = $_} })
    }
    if ((Test-DesktopReadiness @argsForCase) -ne $case.Expected) { throw "Failed: $($case.Name)" }
}
Write-Output 'PASS: PowerShell syntax, XAML XML structure, and 8 mocked readiness cases. Windows runtime checks remain pending.'

. (Join-Path $PSScriptRoot 'Install-BitLockerPin.ps1')
$fixture = Join-Path ([IO.Path]::GetTempPath()) ('ServiceUIFixture-' + [guid]::NewGuid() + '.exe')
$oldArchitecture = $env:PROCESSOR_ARCHITECTURE
$oldWowArchitecture = $env:PROCESSOR_ARCHITEW6432
try {
    $env:PROCESSOR_ARCHITECTURE = 'AMD64'; $env:PROCESSOR_ARCHITEW6432 = ''
    $bytes = New-Object byte[] 134
    [BitConverter]::GetBytes([uint16]0x5A4D).CopyTo($bytes,0)
    [BitConverter]::GetBytes([int32]128).CopyTo($bytes,60)
    [BitConverter]::GetBytes([uint32]0x4550).CopyTo($bytes,128)
    [BitConverter]::GetBytes([uint16]0x8664).CopyTo($bytes,132)
    [IO.File]::WriteAllBytes($fixture,$bytes)
    Assert-ServiceUIBinary -Path $fixture
    $env:PROCESSOR_ARCHITECTURE = 'ARM64'
    $failed = $false
    try { Assert-ServiceUIBinary -Path $fixture } catch { $failed = $true }
    if ($failed) { throw 'ARM64 was rejected.' }
    $env:PROCESSOR_ARCHITECTURE = 'AMD64'
    [BitConverter]::GetBytes([uint16]0x14C).CopyTo($bytes,132)
    [IO.File]::WriteAllBytes($fixture,$bytes)
    $failed = $false
    try { Assert-ServiceUIBinary -Path $fixture } catch { $failed = $true }
    if (-not $failed) { throw 'x86 binary was accepted.' }
    Write-Output 'PASS: binary identity fixtures accepted x64 on x64 and ARM64 hosts; rejected x86 image. Synthetic header is not genuine ServiceUI.'
} finally {
    $env:PROCESSOR_ARCHITECTURE = $oldArchitecture
    $env:PROCESSOR_ARCHITEW6432 = $oldWowArchitecture
    Remove-Item -LiteralPath $fixture -Force -ErrorAction SilentlyContinue
}

