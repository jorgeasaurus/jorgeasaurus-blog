#Requires -Version 5.1
<# .SYNOPSIS
Synchronous SYSTEM ServiceUI startup PIN enrollment. Supply a reviewed ServiceUI binary.
#>
[CmdletBinding()]
param(

    [string]$ServiceUIPath,
    [ValidateNotNullOrEmpty()][string]$CompanyName = 'Your company',
    [switch]$InitializeRecoveryOnly,
    [switch]$Interactive,
    [int]$ExpectedSessionId = 0
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
function Write-PinEnrollmentLog {
    param(
        [ValidateSet('LOG_TEST','START','PREFLIGHT_READY','PREFLIGHT_FAILED','UI_OPEN','PIN_CREATION_START','PIN_CREATION_SUCCESS','PIN_CREATION_FAILED','BITLOCKER_ERROR','RESULT','ALREADY_ENROLLED','INSTALL_FAILED')][string]$Event,
        [int]$ExitCode = -1,
        [string]$ErrorCode = '',
        [int]$ScriptLine = 0
    )
    # Never write exception text, command lines, PINs, or protector values.
    if ($env:OS -ne 'Windows_NT') { return }
    $logMutex = $null
    $ownsLogMutex = $false
    try {
        $folder = Join-Path $env:ProgramData 'Microsoft\IntuneManagementExtension\Logs'
        $null = New-Item -ItemType Directory -Path $folder -Force
        $logMutex = New-Object Threading.Mutex($false, 'Global\BitLockerPinEnrollmentLog')
        try { $ownsLogMutex = $logMutex.WaitOne(2000) } catch [Threading.AbandonedMutexException] { $ownsLogMutex = $true }
        if (-not $ownsLogMutex) { return }
        $path = Join-Path $folder 'BitLockerPinEnrollment.log'
        if ((Test-Path -LiteralPath $path) -and (Get-Item -LiteralPath $path).Length -gt 2MB) {
            Move-Item -LiteralPath $path -Destination ($path + '.1') -Force
        }
        if ($ErrorCode -cnotmatch '^(0x[0-9A-F]{8}|[A-Z_]{1,64})$') { $ErrorCode = '' }
        $line = '{0:o} PID={1} Session={2} Event={3} ExitCode={4} ErrorCode={5} Line={6}' -f [DateTime]::UtcNow, $PID, [Diagnostics.Process]::GetCurrentProcess().SessionId, $Event, $ExitCode, $ErrorCode, $ScriptLine
        [IO.File]::AppendAllText($path, $line + [Environment]::NewLine, (New-Object Text.UTF8Encoding($false)))
    } catch { } finally {
        if ($ownsLogMutex) { $logMutex.ReleaseMutex() }
        if ($logMutex) { $logMutex.Dispose() }
    }
}

function Assert-ServiceUIBinary {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $nativeArchitecture = $env:PROCESSOR_ARCHITEW6432
    if (-not $nativeArchitecture) { $nativeArchitecture = $env:PROCESSOR_ARCHITECTURE }
    if ($nativeArchitecture -notin @('AMD64','ARM64')) { throw 'This ServiceUI package supports x64 and ARM64 Windows.' }
    $item = Get-Item -LiteralPath $Path -ErrorAction Stop
    if ($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'ServiceUI must be a regular local executable.' }
    $stream = [IO.File]::OpenRead($item.FullName)
    $reader = New-Object IO.BinaryReader $stream
    try {
        if ($reader.ReadUInt16() -ne 0x5A4D) { throw 'ServiceUI is not a PE executable.' }
        $stream.Position = 0x3C
        $offset = $reader.ReadInt32()
        if ($offset -lt 64 -or $offset -gt ($stream.Length - 6)) { throw 'Invalid PE header.' }
        $stream.Position = $offset
        if ($reader.ReadUInt32() -ne 0x4550 -or $reader.ReadUInt16() -ne 0x8664) { throw 'Supply the reviewed x64 ServiceUI build.' }
    } finally { $reader.Dispose(); $stream.Dispose() }
}

function Import-PinLogo {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $file = Get-Item -LiteralPath $Path -ErrorAction Stop
    if ($file.PSIsContainer -or $file.Extension.ToLowerInvariant() -notin @('.png','.jpg','.jpeg')) {
        throw 'Logo must be a local PNG or JPEG file. Recommended: transparent 256x256 PNG.'
    }
    if ($file.Length -gt 2MB) { throw 'Logo must be no larger than 2 MB.' }
    $stream = [IO.File]::OpenRead($file.FullName)
    try {
        $decoder = [Windows.Media.Imaging.BitmapDecoder]::Create(
            $stream, [Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,
            [Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
        if ($decoder -isnot [Windows.Media.Imaging.PngBitmapDecoder] -and
            $decoder -isnot [Windows.Media.Imaging.JpegBitmapDecoder]) { throw 'Logo content must be PNG or JPEG.' }
        $bitmap = $decoder.Frames[0]
        if ($bitmap.PixelWidth -lt 64 -or $bitmap.PixelWidth -gt 2048 -or
            $bitmap.PixelHeight -lt 64 -or $bitmap.PixelHeight -gt 2048) {
            throw 'Each logo side must be 64-2048 pixels. Recommended: transparent 256x256 PNG.'
        }
        $bitmap.Freeze()
        return $bitmap
    } finally { $stream.Dispose() }
}

function Test-PinEnrollmentComplete {
    [CmdletBinding()]
    param([Parameter(Mandatory)][object]$Volume)
    $protectors = @($Volume.KeyProtector)
    $pinCount = @($protectors | Where-Object KeyProtectorType -eq 'TpmPin').Count
    if ($pinCount -eq 0) { return $false }
    if ($pinCount -ne 1 -or $Volume.LockStatus -ne 'Unlocked' -or
        $Volume.VolumeType -ne 'OperatingSystem' -or $Volume.VolumeStatus -ne 'FullyEncrypted' -or
        $Volume.ProtectionStatus -ne 'On' -or
        @($protectors | Where-Object KeyProtectorType -eq 'RecoveryPassword').Count -lt 1 -or
        @($protectors | Where-Object { $_.KeyProtectorType -notin @('TpmPin','RecoveryPassword') }).Count) {
        throw 'PIN_PARTIAL_STATE: IT must inspect BitLocker protectors and protection status before retrying.'
    }
    return $true
}
function Get-PinEnrollmentState {
    [CmdletBinding()]
    param([string]$MountPoint = $env:SystemDrive)
    $volume = Get-BitLockerVolume -MountPoint $MountPoint -ErrorAction Stop
    $protectors = @($volume.KeyProtector)
    if (@($protectors | Where-Object KeyProtectorType -eq 'TpmPin').Count) {
        throw 'A startup PIN already exists. This package only enrolls TPM-only devices.'
    }
    if ($volume.LockStatus -ne 'Unlocked' -or $volume.VolumeType -ne 'OperatingSystem' -or $volume.VolumeStatus -ne 'FullyEncrypted' -or $volume.ProtectionStatus -ne 'On') {
        throw 'The OS drive must be fully encrypted with BitLocker protection on.'
    }
    if (@($protectors | Where-Object KeyProtectorType -eq 'Tpm').Count -ne 1 -or
        @($protectors | Where-Object KeyProtectorType -eq 'RecoveryPassword').Count -lt 1 -or
        @($protectors | Where-Object { $_.KeyProtectorType -notin @('Tpm','RecoveryPassword') }).Count) {
        throw 'Expected one TPM-only protector and at least one recovery-password protector, with no other protector types.'
    }
    $tpm = Get-CimInstance -Namespace 'root/cimv2/security/microsofttpm' -ClassName Win32_Tpm -ErrorAction Stop
    foreach ($method in @('IsEnabled','IsActivated','IsOwned')) {
        $result = Invoke-CimMethod -InputObject $tpm -MethodName $method -WhatIf:$false -Confirm:$false -ErrorAction Stop
        if ($result.ReturnValue -ne 0 -or -not $result.$method) { throw 'The TPM is not enabled, activated, and owned.' }
    }
    $policy = Get-ItemProperty -LiteralPath 'HKLM:\SOFTWARE\Policies\Microsoft\FVE' -ErrorAction Stop
    if (-not $policy.PSObject.Properties['UseAdvancedStartup'] -or $policy.UseAdvancedStartup -ne 1 -or
        -not $policy.PSObject.Properties['UseTPMPIN'] -or $policy.UseTPMPIN -ne 2) {
        throw 'POLICY_NOT_READY: Enable startup authentication and allow TPM and TPM+PIN.'
    }
    if (-not $policy.PSObject.Properties['UseTPM'] -or $policy.UseTPM -ne 2) { throw 'POLICY_NOT_READY: Allow TPM startup.' }
    $minimum = 6
    if ($policy.PSObject.Properties['MinimumPIN']) { $minimum = [Math]::Max(6, [int]$policy.MinimumPIN) }
    if ($minimum -gt 20) { throw 'Configured PIN minimum exceeds 20.' }
    [pscustomobject]@{ Volume = $volume; MinimumPinLength = $minimum }
}
function Add-StartupPin {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [Parameter(Mandatory)][Security.SecureString]$Pin,

        [string]$MountPoint = $env:SystemDrive
    )
    $state = Get-PinEnrollmentState -MountPoint $MountPoint
    $pointer = [IntPtr]::Zero
    try {
        if ($Pin.Length -lt $state.MinimumPinLength -or $Pin.Length -gt 20) { throw 'PIN length does not meet policy.' }
        $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Pin)
        for ($i = 0; $i -lt $Pin.Length; $i++) {
            $character = [Runtime.InteropServices.Marshal]::ReadInt16($pointer, $i * 2)
            if ($character -lt 48 -or $character -gt 57) { throw 'Only digits 0-9 are supported.' }
        }
    } finally {
        if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    }
    $tpmIds = @($state.Volume.KeyProtector | Where-Object KeyProtectorType -eq 'Tpm' | Select-Object -ExpandProperty KeyProtectorId)
    $recoveryIds = @($state.Volume.KeyProtector | Where-Object KeyProtectorType -eq 'RecoveryPassword' | Select-Object -ExpandProperty KeyProtectorId)
    if (-not $PSCmdlet.ShouldProcess($MountPoint, 'Add TPM+PIN, verify it, then remove TPM-only protector')) { return }
    # The high-level cmdlet deletes TPM-only protectors internally. Use CIM to
    # preserve them until our explicit readback succeeds.
    $drive = Get-CimInstance -Namespace 'root/cimv2/security/MicrosoftVolumeEncryption' -ClassName Win32_EncryptableVolume -ErrorAction Stop |
        Where-Object { $_.DriveLetter -eq $MountPoint }
    if (@($drive).Count -ne 1) { throw 'Unable to identify the encrypted OS volume.' }
    $pointer = [IntPtr]::Zero
    $plainPin = $null
    try {
        $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Pin)
        $plainPin = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
        $created = Invoke-CimMethod -InputObject $drive -MethodName ProtectKeyWithTPMAndPIN -Arguments @{ PIN = $plainPin } -Confirm:$false -ErrorAction Stop
        if ($created.ReturnValue -ne 0) {
            throw (New-Object System.ComponentModel.Win32Exception ([int]([long]$created.ReturnValue -band 65535), ('TPM+PIN creation failed: 0x{0:X8}' -f [uint32]$created.ReturnValue)))
        }
    } finally {
        $plainPin = $null
        if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    }
    $afterAdd = Get-BitLockerVolume -MountPoint $MountPoint -ErrorAction Stop
    if (@($afterAdd.KeyProtector | Where-Object KeyProtectorType -eq 'TpmPin').Count -ne 1 -or
        @($recoveryIds | Where-Object { $_ -notin @($afterAdd.KeyProtector.KeyProtectorId) }).Count) {
        throw 'Verification after adding the PIN failed. TPM-only removal was not attempted.'
    }
    foreach ($id in $tpmIds) {
        $null = Remove-BitLockerKeyProtector -MountPoint $MountPoint -KeyProtectorId $id -ErrorAction Stop
    }
    $final = Get-BitLockerVolume -MountPoint $MountPoint -ErrorAction Stop
    if ($final.ProtectionStatus -ne 'On' -or
        @($final.KeyProtector | Where-Object KeyProtectorType -eq 'Tpm').Count -ne 0 -or
        @($final.KeyProtector | Where-Object KeyProtectorType -eq 'TpmPin').Count -ne 1 -or
        @($recoveryIds | Where-Object { $_ -notin @($final.KeyProtector.KeyProtectorId) }).Count) {
        throw 'Final verification failed. Do not reboot until an administrator inspects protector state.'
    }
    [pscustomobject]@{ Status = 'Enrolled'; MountPoint = $MountPoint; RebootTestPending = $true }
}

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

function Test-InstallDesktop {
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
return $ready


}

function Initialize-PinProtection {
    $v = Get-BitLockerVolume -MountPoint $env:SystemDrive -ErrorAction Stop
    if ($v.VolumeType -ne 'OperatingSystem' -or $v.LockStatus -ne 'Unlocked' -or $v.VolumeStatus -ne 'FullyEncrypted') { throw 'BITLOCKER_NOT_READY: Finish OS drive encryption first.' }
    if ($v.ProtectionStatus -eq 'On') { return }
    if (-not $InitializeRecoveryOnly) { throw 'BITLOCKER_NOT_PROTECTED: IT must initialize recovery-only protection or supply the reviewed initialization option.' }
    $kp = @($v.KeyProtector)
    if ($kp.Count -lt 1 -or @($kp | Where-Object KeyProtectorType -ne 'RecoveryPassword').Count) { throw 'BITLOCKER_SUSPENDED: IT must inspect suspended protection.' }
    $policy = Get-ItemProperty 'HKLM:\SOFTWARE\Policies\Microsoft\FVE'
    if ($policy.UseAdvancedStartup -ne 1 -or $policy.UseTPM -ne 2 -or $policy.UseTPMPIN -ne 2) { throw 'POLICY_NOT_READY: Allow TPM and startup PIN with TPM.' }
    $tpm = Get-CimInstance -Namespace 'root/cimv2/security/microsofttpm' -ClassName Win32_Tpm -ErrorAction Stop
    foreach ($method in @('IsEnabled','IsActivated','IsOwned')) {
        $result = Invoke-CimMethod -InputObject $tpm -MethodName $method -Confirm:$false -ErrorAction Stop
        if ($result.ReturnValue -ne 0 -or -not $result.$method) { throw 'TPM_NOT_READY' }
    }
    $recoveryIds = @($kp | Select-Object -ExpandProperty KeyProtectorId)
    try {
        foreach ($id in $recoveryIds) { BackupToAAD-BitLockerKeyProtector -MountPoint $env:SystemDrive -KeyProtectorId $id -ErrorAction Stop | Out-Null }
    } catch { throw 'RECOVERY_BACKUP_FAILED: No TPM initialization was attempted.' }
    $drive = @(Get-CimInstance -Namespace 'root/cimv2/security/MicrosoftVolumeEncryption' -ClassName Win32_EncryptableVolume | Where-Object DriveLetter -eq $env:SystemDrive)
    if ($drive.Count -ne 1) { throw 'VOLUME_NOT_FOUND' }
    $r = Invoke-CimMethod -InputObject $drive[0] -MethodName ProtectKeyWithTPM -Arguments @{ FriendlyName = 'Startup PIN enrollment preparation' } -Confirm:$false -ErrorAction Stop
    if ($r.ReturnValue -ne 0) { throw 'TPM_CREATION_FAILED' }
    $after = Get-BitLockerVolume -MountPoint $env:SystemDrive
    if (@($after.KeyProtector | Where-Object KeyProtectorType -eq 'Tpm').Count -ne 1 -or @($recoveryIds | Where-Object { $_ -notin @($after.KeyProtector.KeyProtectorId) }).Count) { throw 'TPM_VERIFICATION_FAILED' }
    try { Resume-BitLocker -MountPoint $env:SystemDrive -ErrorAction Stop | Out-Null } catch { throw 'PROTECTION_RESUME_FAILED: TPM protector was created; inspect protection before retrying.' }
    if ((Get-BitLockerVolume -MountPoint $env:SystemDrive).ProtectionStatus -ne 'On') { throw 'PROTECTION_RESUME_FAILED' }
}

function Show-InstallPinUI {
$MinimumPinLength = 6
$LogoPath = Join-Path $PSScriptRoot 'generic-logo.png'
$preflightFailure = $null
try {
    Initialize-PinProtection
    $state = Get-PinEnrollmentState
    $MinimumPinLength = [Math]::Max($MinimumPinLength, $state.MinimumPinLength)
    Write-PinEnrollmentLog -Event PREFLIGHT_READY
} catch {
    # Only fixed messages are shown or persisted; never raw device data.
    $preflightFailure = switch ($_.Exception.Message) {
        'The OS drive must be fully encrypted with BitLocker protection on.' {
            @{ Code = 'BITLOCKER_NOT_PROTECTED'; Message = 'Your device is not ready for PIN setup. IT must finish encryption and enable BitLocker protection first.' }
        }
        'Expected one TPM-only protector and at least one recovery-password protector, with no other protector types.' {
            @{ Code = 'PROTECTOR_STATE_INVALID'; Message = 'Your device is not ready for PIN setup. IT must verify TPM-only protection and a recovery protector first.' }
        }
        { $_ -match '^(BITLOCKER_NOT_READY|BITLOCKER_NOT_PROTECTED|BITLOCKER_SUSPENDED|POLICY_NOT_READY|TPM_NOT_READY|TPM_CREATION_FAILED|TPM_VERIFICATION_FAILED|PROTECTION_RESUME_FAILED|RECOVERY_BACKUP_FAILED)' } {
            @{ Code = ($_.Split(':')[0]); Message = 'Your device is not ready for PIN setup. Contact IT to check encryption, recovery backup, and startup policy.' }
        }
        default {
            @{ Code = 'PREFLIGHT_FAILED'; Message = 'Your device is not ready for PIN setup. Contact IT to check BitLocker, TPM readiness, and startup policy.' }
        }
    }
}
Add-Type -AssemblyName PresentationFramework
[xml]$markup = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'PinWindow.xaml') -Raw -Encoding UTF8
$reader = New-Object System.Xml.XmlNodeReader $markup
try { $window = [Windows.Markup.XamlReader]::Load($reader) } finally { $reader.Close() }
$company = $window.FindName('Company')
$logo = $window.FindName('Logo')
$pin = $window.FindName('Pin')
$confirmation = $window.FindName('Confirmation')
$status = $window.FindName('Status')
$company.Text = $CompanyName
$window.Title = 'Set your startup PIN'
$window.Topmost = $true
$window.FindName('Submit').Content = 'Set startup PIN'
$window.FindName('PreviewNotice').Text = 'Keep your PIN private. You can cancel and complete setup later.'
$window.FindName('Later').Content = 'Cancel'
$window.FindName('Later').Visibility = 'Visible'
# 0 = enrollment completed, 1 = failed, 1602 = user cancelled.
$script:enrollmentExitCode = 1602
$script:allowClose = $true
$window.Add_Closing({ param($sender, $eventArgs)
    if (-not $script:allowClose) { $eventArgs.Cancel = $true }
})
$window.FindName('Instructions').Text = "Choose $MinimumPinLength to 20 digits. You will enter this PIN before Windows starts. This is separate from your Windows sign-in PIN."
$pin.MaxLength = 20
$confirmation.MaxLength = 20
if ($LogoPath) {
    $logo.Source = Import-PinLogo -Path $LogoPath
    $logo.Visibility = 'Visible'
}
if ($preflightFailure) {
    Write-PinEnrollmentLog -Event PREFLIGHT_FAILED -ExitCode 1 -ErrorCode $preflightFailure.Code
    $script:enrollmentExitCode = 1
    $window.FindName('Instructions').Text = 'PIN setup could not start. Contact IT to inspect BitLocker.'
    $pin.IsEnabled = $false
    $confirmation.IsEnabled = $false
    $window.FindName('Submit').Visibility = 'Collapsed'
    $window.FindName('Later').Content = 'Close setup'
    $status.Text = $preflightFailure.Message + ' Reference: ' + $preflightFailure.Code
    try {
        ('{0:o} {1}' -f [DateTime]::UtcNow, $preflightFailure.Code) |
            Set-Content -LiteralPath (Join-Path $PSScriptRoot 'LastPreflightFailure.txt') -Encoding UTF8
    } catch { }
    $window.FindName('Later').Add_Click({ $window.Close() })
    $null = $window.ShowDialog()
    return 1
}
$window.FindName('Submit').Add_Click({
    # The PIN remains in this elevated process; no command-line or file transfer.
    $first = $pin.Password
    $second = $confirmation.Password
    try {
        if ($first -cnotmatch "\A[0-9]{$MinimumPinLength,20}\z") {
            $status.Text = "Enter $MinimumPinLength to 20 digits (0-9)."
        } elseif ($first -cne $second) {
            $status.Text = 'The PIN entries do not match. Try again.'
        } else {
            $securePin = $pin.SecurePassword
            try {
                $window.FindName('Submit').IsEnabled = $false
                $window.FindName('Later').IsEnabled = $false
                $script:allowClose = $false
                Write-PinEnrollmentLog -Event PIN_CREATION_START
                $null = Add-StartupPin -Pin $securePin -Confirm:$false
                Write-PinEnrollmentLog -Event PIN_CREATION_SUCCESS -ExitCode 0
                $script:enrollmentExitCode = 0
                $script:allowClose = $true
                $status.Text = 'Startup PIN set. Arrange a restart to test it. This app will not restart your device.'
                $window.FindName('Later').Content = 'Finish'
                $window.FindName('Later').Visibility = 'Visible'
                $window.Close()
            } catch {
                $script:enrollmentExitCode = 1
                $errorCode = '{0:X8}' -f ($_.Exception.HResult -band 0xFFFFFFFFL)
                Write-PinEnrollmentLog -Event PIN_CREATION_FAILED -ExitCode 1 -ErrorCode ('0x' + $errorCode) -ScriptLine $_.InvocationInfo.ScriptLineNumber
                $errorId = $_.FullyQualifiedErrorId -replace '[^a-zA-Z0-9_,.\-]', '_'
                $status.Text = "Setup failed ($errorId; 0x$errorCode). Contact IT before restarting."
                Write-Warning ("PIN enrollment failed. Error ID: {0}; HRESULT: 0x{1}; script line: {2}" -f $errorId, $errorCode, $_.InvocationInfo.ScriptLineNumber)
                if ($_.Exception.Message -match 'TPM\+PIN creation failed: (0x[0-9A-F]{8})') {
                    $status.Text = "Setup failed ($($Matches[1])). Contact IT before restarting."
                    Write-PinEnrollmentLog -Event BITLOCKER_ERROR -ExitCode 1 -ErrorCode $Matches[1]
                    Write-Warning ("BitLocker returned " + $Matches[1])
                    if ($Matches[1] -eq '0x803100B5') {
                        $status.Text = 'Windows did not detect a preboot keyboard. IT must verify keyboard input before Windows starts and review the slate preboot-input policy. No automatic policy override was applied.'
                    }
                }
                $script:allowClose = $true
                $window.FindName('Later').Content = 'Close failed setup'
                $window.FindName('Later').Visibility = 'Visible'
            } finally {
                $script:allowClose = $true
                $window.FindName('Later').IsEnabled = $true
                $securePin.Dispose(); $pin.Clear(); $confirmation.Clear()
            }
        }
    } finally { $first = $null; $second = $null }
})
$window.FindName('Later').Add_Click({ $window.Close() })
$window.Add_ContentRendered({ $null = $window.Activate(); $null = $window.Focus(); $null = $pin.Focus() })
Write-PinEnrollmentLog -Event UI_OPEN
try { $null = $window.ShowDialog() } finally { $pin.Clear(); $confirmation.Clear() }

return $script:enrollmentExitCode

}

function Write-InstallResult {
    param([string]$Folder, [ValidateSet('STARTING','COMPLETED','CANCELLED','FAILED')][string]$Status, [int]$ExitCode)
    Write-PinEnrollmentLog -Event RESULT -ExitCode $ExitCode -ErrorCode $Status
    if (-not $Folder) { return }
    try {
        ('{0:o} {1} ExitCode={2}' -f [DateTime]::UtcNow, $Status, $ExitCode) |
            Set-Content -LiteralPath (Join-Path $Folder 'LastInstallResult.txt') -Encoding UTF8
    } catch { }
}

if ($MyInvocation.InvocationName -eq '.') { return }
Write-PinEnrollmentLog -Event START
$destination = Join-Path $env:ProgramFiles 'BitLockerPin'
$mutex = $null
$ownsMutex = $false
$destination = $null
try {
    if ([Security.Principal.WindowsIdentity]::GetCurrent().User.Value -ne 'S-1-5-18') { throw 'SYSTEM_REQUIRED' }
    if (-not [Environment]::Is64BitProcess) { throw 'NATIVE_64BIT_REQUIRED' }
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class PinInstallConsole {
 [DllImport("kernel32.dll")] public static extern uint WTSGetActiveConsoleSessionId();
}
'@
    $console = [PinInstallConsole]::WTSGetActiveConsoleSessionId()
    $session = [Diagnostics.Process]::GetCurrentProcess().SessionId
    if (-not (Test-InstallDesktop) -or $console -eq [uint32]::MaxValue -or $console -le 0) { throw 'DESKTOP_NOT_READY' }
    $consoleExplorer = @(Get-Process explorer -ErrorAction SilentlyContinue | Where-Object SessionId -eq $console)
    $consoleTray = @(Get-Process SecurityHealthSystray -ErrorAction SilentlyContinue | Where-Object SessionId -eq $console)
    if ($consoleExplorer.Count -eq 0 -or $consoleTray.Count -eq 0) { throw 'CONSOLE_DESKTOP_NOT_READY' }
    if (Test-PinEnrollmentComplete -Volume (Get-BitLockerVolume -MountPoint $env:SystemDrive)) { Write-PinEnrollmentLog -Event ALREADY_ENROLLED -ExitCode 0; exit 0 }
    if ($Interactive) {
        if ($session -ne $ExpectedSessionId -or $session -ne $console) { throw 'INTERACTIVE_SESSION_INVALID' }
        if ([Threading.Thread]::CurrentThread.ApartmentState -ne 'STA') { throw 'STA_REQUIRED' }
        # Hide only this process's console; the WPF window remains independent.
        Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class PinEnrollmentConsole {
    [DllImport("kernel32.dll")]
    public static extern IntPtr GetConsoleWindow();
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool ShowWindow(IntPtr window, int command);
}
'@
        $consoleWindow = [PinEnrollmentConsole]::GetConsoleWindow()
        if ($consoleWindow -ne [IntPtr]::Zero) {
            $null = [PinEnrollmentConsole]::ShowWindow($consoleWindow, 0)
        }
        $result = Show-InstallPinUI
        if ($result -eq 0 -and -not (Test-PinEnrollmentComplete -Volume (Get-BitLockerVolume -MountPoint $env:SystemDrive))) { exit 1 }
        exit $result
    }
    if ($session -ne 0) { throw 'INSTALL_REQUIRES_SESSION_ZERO' }
    $mutex = New-Object Threading.Mutex($false, 'Global\BitLockerPinEnrollment')
    try { $ownsMutex = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $ownsMutex = $true }
    if (-not $ownsMutex) { exit 1618 }
    if (-not $ServiceUIPath) { throw 'SERVICEUI_PARAMETERS_REQUIRED' }
    Assert-ServiceUIBinary -Path $ServiceUIPath
    Write-PinEnrollmentLog -Event START
$destination = Join-Path $env:ProgramFiles 'BitLockerPin'
    $legacy = Get-ScheduledTask -TaskName 'BitLocker startup PIN' -ErrorAction SilentlyContinue
    if ($legacy -and $legacy.State -eq 'Running') { exit 1618 }
    if (Test-Path -LiteralPath $destination) {
        $existing = @(Get-Item -LiteralPath $destination) + @(Get-ChildItem -LiteralPath $destination -Force -Recurse)
        if (@($existing | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }).Count) { throw 'REPARSE_POINT_REJECTED' }
    }
    New-Item -Path $destination -ItemType Directory -Force | Out-Null
    $acl = New-Object Security.AccessControl.DirectorySecurity
    $acl.SetAccessRuleProtection($true, $false)
    $acl.SetOwner((New-Object Security.Principal.SecurityIdentifier('S-1-5-32-544')))
    foreach ($entry in @(@('S-1-5-18','FullControl'), @('S-1-5-32-544','FullControl'), @('S-1-5-32-545','ReadAndExecute'))) {
        $sid = New-Object Security.Principal.SecurityIdentifier($entry[0])
        $acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($sid, $entry[1], 'ContainerInherit,ObjectInherit', 'None', 'Allow')))
    }
    Set-Acl -LiteralPath $destination -AclObject $acl
    foreach ($name in @('Install-BitLockerPin.ps1','PinWindow.xaml','generic-logo.png')) {
        $source = Join-Path $PSScriptRoot $name
        $target = Join-Path $destination $name
        if ([IO.Path]::GetFullPath($source) -ne [IO.Path]::GetFullPath($target)) { Copy-Item -LiteralPath $source -Destination $target -Force }
    }
    $serviceUI = Join-Path $destination 'ServiceUI.exe'
    if ([IO.Path]::GetFullPath($ServiceUIPath) -ne [IO.Path]::GetFullPath($serviceUI)) { Copy-Item -LiteralPath $ServiceUIPath -Destination $serviceUI -Force }
    foreach ($file in Get-ChildItem -LiteralPath $destination -File) {
        $fileAcl = New-Object Security.AccessControl.FileSecurity
        $fileAcl.SetAccessRuleProtection($false, $false)
        $fileAcl.SetOwner((New-Object Security.Principal.SecurityIdentifier('S-1-5-32-544')))
        Set-Acl -LiteralPath $file.FullName -AclObject $fileAcl
    }
    Assert-ServiceUIBinary -Path $serviceUI
    $legacy = Get-ScheduledTask -TaskName 'BitLocker startup PIN' -ErrorAction SilentlyContinue
    if ($legacy) {
        if ($legacy.Principal.UserId -notin @('SYSTEM','S-1-5-18') -or @($legacy.Actions | Where-Object { $_.Arguments -notlike ('*' + $destination + '*') }).Count) { throw 'LEGACY_TASK_NOT_OWNED' }
        Disable-ScheduledTask -TaskName 'BitLocker startup PIN' | Out-Null
        Stop-ScheduledTask -TaskName 'BitLocker startup PIN'
        Unregister-ScheduledTask -TaskName 'BitLocker startup PIN' -Confirm:$false
    }
    Remove-Item -LiteralPath (Join-Path $destination 'LastPreflightFailure.txt') -Force -ErrorAction SilentlyContinue
    Write-InstallResult -Folder $destination -Status STARTING -ExitCode 0
    Push-Location -LiteralPath $destination
    try {
        $powerShell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
        # Encode trusted invocation metadata only. A PIN never crosses a process boundary.
        $companyLiteral = $CompanyName.Replace("'", "''")
        $childCommand = "& '.\Install-BitLockerPin.ps1' -Interactive -ExpectedSessionId $console -CompanyName '$companyLiteral'"
        if ($InitializeRecoveryOnly) { $childCommand += ' -InitializeRecoveryOnly' }
        $childCommand += '; exit $LASTEXITCODE'
        $encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($childCommand))
        & $serviceUI ('-session:{0}' -f $console) $powerShell -NoProfile -STA -ExecutionPolicy Bypass -EncodedCommand $encodedCommand
        $code = $LASTEXITCODE
    } finally { Pop-Location }
    if ($code -eq 0 -and -not (Test-PinEnrollmentComplete -Volume (Get-BitLockerVolume -MountPoint $env:SystemDrive))) { $code = 1 }
    $status = 'FAILED'
    if ($code -eq 0) { $status = 'COMPLETED' } elseif ($code -eq 1602) { $status = 'CANCELLED' }
    Write-InstallResult -Folder $destination -Status $status -ExitCode $code
    exit $code
} catch {
    Write-PinEnrollmentLog -Event INSTALL_FAILED -ExitCode 1 -ErrorCode ($_.Exception.Message.Split(':')[0]) -ScriptLine $_.InvocationInfo.ScriptLineNumber
    Write-InstallResult -Folder $destination -Status FAILED -ExitCode 1
    Write-Warning 'Startup PIN setup failed. Check the protected installation log and UI reference code.'
    exit 1
} finally {
    if ($ownsMutex) { $mutex.ReleaseMutex() }
    if ($mutex) { $mutex.Dispose() }
}
