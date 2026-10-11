#Requires -Version 5.1
<#
.SYNOPSIS
    Preview the startup PIN interface. Does not change BitLocker.
.PARAMETER LogoPath
    Local PNG/JPEG; each side 64-2048 px; maximum 2 MB. Recommended: transparent
    256x256 PNG. Fits within 220x64 WPF display units without cropping.
    Defaults to generic-logo.png beside this script; pass an empty string for text only.
.EXAMPLE
    powershell.exe -NoProfile -STA -File .\Show-BitLockerPinPreview.ps1 -CompanyName 'Contoso' -LogoPath '.\logo.png'
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
$window.FindName('Instructions').Text = "Choose $MinimumPinLength to 20 digits. You will enter this PIN before Windows starts. This is separate from your Windows sign-in PIN."
$pin.MaxLength = 20
$confirmation.MaxLength = 20
if ($LogoPath) {
    . (Join-Path $PSScriptRoot 'Logo.ps1')
    $logo.Source = Import-PinLogo -Path $LogoPath
    $logo.Visibility = 'Visible'
}
$window.FindName('Submit').Add_Click({
    # Preview only: no PIN is returned, written to disk, or sent to a process.
    $first = $pin.Password
    $second = $confirmation.Password
    try {
        if ($first -cnotmatch "\A[0-9]{$MinimumPinLength,20}\z") {
            $status.Text = "Enter $MinimumPinLength to 20 digits (0-9)."
        } elseif ($first -cne $second) {
            $status.Text = 'The PIN entries do not match. Try again.'
        } else {
            $status.Text = 'Preview validation passed. BitLocker was not changed. Close this window to finish.'
            $pin.Clear()
            $confirmation.Clear()
        }
    } finally { $first = $null; $second = $null }
})
$window.FindName('Later').Add_Click({ $window.Close() })
$window.Add_ContentRendered({ $null = $pin.Focus() })
try { $null = $window.ShowDialog() } finally { $pin.Clear(); $confirmation.Clear() }
