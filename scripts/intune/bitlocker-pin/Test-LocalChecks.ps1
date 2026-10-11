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

. (Join-Path $PSScriptRoot 'Invoke-BitLockerPinServiceUI.ps1')
$sessionCases = @(
    @{Console=1; Explorer=@(1); Tray=@(1); Expected=$true},
    @{Console=1; Explorer=@(1,2); Tray=@(1,2); Expected=$false},
    @{Console=1; Explorer=@(2); Tray=@(2); Expected=$false},
    @{Console=1; Explorer=@(1,1); Tray=@(1); Expected=$false},
    @{Console=1; Explorer=@(1); Tray=@(); Expected=$false},
    @{Console=0; Explorer=@(0); Tray=@(0); Expected=$false},
    @{Console=4294967295; Explorer=@(); Tray=@(); Expected=$false}
)
foreach ($case in $sessionCases) {
    $shell = @($case.Explorer | ForEach-Object { [pscustomobject]@{SessionId=$_} })
    $tray = @($case.Tray | ForEach-Object { [pscustomobject]@{SessionId=$_} })
    if ((Test-ServiceUISession -ConsoleSessionId $case.Console -ExplorerProcesses $shell -TrayProcesses $tray) -ne $case.Expected) { throw 'ServiceUI session selection failed.' }
}
Write-Output 'PASS: 7 mocked ServiceUI session-selection cases. No binary or standard-user runtime test performed.'

. (Join-Path $PSScriptRoot 'ServiceUIValidation.ps1')
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

Import-Module (Join-Path $PSScriptRoot 'BitLockerPin.psm1') -Force
$completionCases = @(
    @{Name='Complete'; Types=@('TpmPin','RecoveryPassword'); Protection='On'; Expected='True'},
    @{Name='TPM only'; Types=@('Tpm','RecoveryPassword'); Protection='On'; Expected='False'},
    @{Name='Partial creation'; Types=@('Tpm','TpmPin','RecoveryPassword'); Protection='On'; Expected='Error'},
    @{Name='Recovery missing'; Types=@('TpmPin'); Protection='On'; Expected='Error'},
    @{Name='Protection off'; Types=@('TpmPin','RecoveryPassword'); Protection='Off'; Expected='Error'},
    @{Name='Extra startup key'; Types=@('TpmPin','RecoveryPassword','ExternalKey'); Protection='On'; Expected='Error'},
    @{Name='Duplicate PIN'; Types=@('TpmPin','TpmPin','RecoveryPassword'); Protection='On'; Expected='Error'}
)
foreach ($case in $completionCases) {
    $volume = [pscustomobject]@{ LockStatus='Unlocked'; VolumeType='OperatingSystem'; VolumeStatus='FullyEncrypted'; ProtectionStatus=$case.Protection; KeyProtector=@($case.Types | ForEach-Object { [pscustomobject]@{KeyProtectorType=$_} }) }
    $actual = 'Error'
    try { $actual = [string](Test-PinEnrollmentComplete -Volume $volume) } catch { if ($_.Exception.Message -notlike 'PIN_PARTIAL_STATE:*') { throw } }
    if ($actual -ne $case.Expected) { throw "Completion classifier failed: $($case.Name)" }
}
Write-Output 'PASS: 7 mocked completed/partial protector-state cases.'

# Execute the actual interactive launcher's enrollment tail with a harmless child.
$exitFixture = Join-Path ([IO.Path]::GetTempPath()) ('PinExitFixture-' + [guid]::NewGuid())
$null = New-Item -Path $exitFixture -ItemType Directory
try {
    $launcherText = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'Start-BitLockerPinInteractive.ps1') -Raw
    $tail = $launcherText.Substring($launcherText.LastIndexOf("& (Join-Path `$PSScriptRoot 'Show-BitLockerPinEnrollment.ps1')"))
    Set-Content -LiteralPath (Join-Path $exitFixture 'Start.ps1') -Value ('$config = @{CompanyName="Fixture"}' + [Environment]::NewLine + $tail)
    $executable = [Diagnostics.Process]::GetCurrentProcess().MainModule.FileName
    foreach ($code in @(0,1,1602)) {
        Set-Content -LiteralPath (Join-Path $exitFixture 'Show-BitLockerPinEnrollment.ps1') -Value ('param([string]$CompanyName)' + [Environment]::NewLine + "exit $code")
        $null = & $executable -NoProfile -File (Join-Path $exitFixture 'Start.ps1')
        $expectedExit = $code
        if ($env:OS -ne 'Windows_NT') { $expectedExit = $code % 256 }
        if ($LASTEXITCODE -ne $expectedExit) { throw "Interactive exit forwarding failed: $code" }
    }
    Write-Output 'PASS: actual launcher enrollment tail forwards harmless child exit codes 0, 1, and 1602.'
} finally { Remove-Item -LiteralPath $exitFixture -Recurse -Force }
