#Requires -Version 5.1
<#
.SYNOPSIS
    Enroll a TPM-only device with a startup PIN in an elevated interactive pilot session.
.PARAMETER LogoPath
    Local PNG/JPEG; each side 64-2048 px; maximum 2 MB. Recommended: transparent
    256x256 PNG. Fits within 220x64 WPF display units without cropping.
    Defaults to generic-logo.png beside this script; pass an empty string for text only.
.EXAMPLE
    powershell.exe -NoProfile -STA -File .\Show-BitLockerPinEnrollment.ps1 -CompanyName 'Contoso' -LogoPath '.\logo.png'
#>
[CmdletBinding()]
param(

    [ValidateNotNullOrEmpty()][string]$CompanyName = 'Your company',
    [string]$LogoPath,
    [ValidateRange(6, 20)][int]$MinimumPinLength = 6
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if (-not $PSBoundParameters.ContainsKey('LogoPath')) {
    $LogoPath = Join-Path -Path $PSScriptRoot -ChildPath 'generic-logo.png'
}
if ($env:OS -ne 'Windows_NT') { throw 'This preview requires Windows and WPF.' }
if ([Threading.Thread]::CurrentThread.ApartmentState -ne 'STA') { throw 'Run Windows PowerShell with -STA.' }
if ([Diagnostics.Process]::GetCurrentProcess().SessionId -eq 0) { throw 'Run this preview in an interactive user session.' }
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Run this pilot from an elevated interactive Windows PowerShell session.' }
Import-Module (Join-Path $PSScriptRoot 'BitLockerPin.psm1') -Force
$preflightFailure = $null
try {
    $state = Get-PinEnrollmentState
    $MinimumPinLength = [Math]::Max($MinimumPinLength, $state.MinimumPinLength)
} catch {
    # Only fixed messages are shown or persisted; never raw device data.
    $preflightFailure = switch ($_.Exception.Message) {
        'The OS drive must be fully encrypted with BitLocker protection on.' {
            @{ Code = 'BITLOCKER_NOT_PROTECTED'; Message = 'Your device is not ready for PIN setup. IT must finish encryption and enable BitLocker protection first.' }
        }
        'Expected one TPM-only protector and at least one recovery-password protector, with no other protector types.' {
            @{ Code = 'PROTECTOR_STATE_INVALID'; Message = 'Your device is not ready for PIN setup. IT must verify TPM-only protection and a recovery protector first.' }
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
    . (Join-Path $PSScriptRoot 'Logo.ps1')
    $logo.Source = Import-PinLogo -Path $LogoPath
    $logo.Visibility = 'Visible'
}
if ($preflightFailure) {
    $script:enrollmentExitCode = 1
    $window.FindName('Instructions').Text = 'PIN setup could not start. No BitLocker changes were made.'
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
    exit 1
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
                $null = Add-StartupPin -Pin $securePin -Confirm:$false
                $script:enrollmentExitCode = 0
                $script:allowClose = $true
                $status.Text = 'Startup PIN set. Arrange a restart to test it. This app will not restart your device.'
                $window.FindName('Later').Content = 'Finish'
                $window.FindName('Later').Visibility = 'Visible'
            } catch {
                $script:enrollmentExitCode = 1
                $errorCode = '{0:X8}' -f ($_.Exception.HResult -band 0xFFFFFFFFL)
                $errorId = $_.FullyQualifiedErrorId -replace '[^a-zA-Z0-9_,.\-]', '_'
                $status.Text = "Setup failed ($errorId; 0x$errorCode). Contact IT before restarting."
                Write-Warning ("PIN enrollment failed. Error ID: {0}; HRESULT: 0x{1}; script line: {2}" -f $errorId, $errorCode, $_.InvocationInfo.ScriptLineNumber)
                if ($_.Exception.Message -match 'TPM\+PIN creation failed: (0x[0-9A-F]{8})') {
                    $status.Text = "Setup failed ($($Matches[1])). Contact IT before restarting."
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
$window.Add_ContentRendered({ $null = $pin.Focus() })
try { $null = $window.ShowDialog() } finally { $pin.Clear(); $confirmation.Clear() }

exit $script:enrollmentExitCode
