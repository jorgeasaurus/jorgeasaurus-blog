#Requires -Version 5.1

<#
.SYNOPSIS
    Example Intune Remediation detection script.
.DESCRIPTION
    Detects whether HKLM:\SOFTWARE\Company\Example\Configured is set to 1.
    Exit 0 means compliant. Exit 1 means Intune should run remediation.
#>

[CmdletBinding()]
param()

# Stop on command errors so Intune receives a clear failure instead of a partial success.
$ErrorActionPreference = 'Stop'

# Write detailed troubleshooting logs beside the native Intune Management Extension logs.
# This makes the custom logs available when collecting diagnostics from Intune.
$LogRoot = Join-Path $env:ProgramData 'Microsoft\IntuneManagementExtension\Logs'
$LogPath = Join-Path $LogRoot 'Company-ExampleRemediation-Detect.log'

function Write-Log {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Message,

        [ValidateSet('INFO', 'WARN', 'ERROR')]
        [string]$Level = 'INFO'
    )

    try {
        # Create the log directory on first run.
        if (-not (Test-Path -Path $LogRoot)) {
            New-Item -Path $LogRoot -ItemType Directory -Force | Out-Null
        }

        # Use a simple timestamped log format that is easy to read from the endpoint.
        $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        Add-Content -Path $LogPath -Value "[$timestamp][$Level] $Message"
    }
    catch {
        Write-Verbose "Unable to write remediation log: $($_.Exception.Message)"
    }
}

try {
    # Replace these three values with the setting your remediation owns.
    $registryPath = 'HKLM:\SOFTWARE\Company\Example'
    $valueName = 'Configured'
    $expectedValue = '1'

    # Missing path means the device is not compliant, so Intune should run remediation.
    if (-not (Test-Path -Path $registryPath)) {
        Write-Log "Missing registry path: $registryPath" 'WARN'
        Write-Output "Not compliant: registry path missing"
        exit 1
    }

    # Read the current value. -ErrorAction Stop sends missing values to catch.
    $actualValue = (Get-ItemProperty -Path $registryPath -Name $valueName -ErrorAction Stop).$valueName

    # Wrong value means the device is not compliant, so Intune should run remediation.
    if ($actualValue -ne $expectedValue) {
        Write-Log "Unexpected value. Expected '$expectedValue', found '$actualValue'." 'WARN'
        Write-Output "Not compliant: incorrect registry value"
        exit 1
    }

    # Exit 0 tells Intune the device is compliant and no remediation is needed.
    Write-Log 'Detection passed.'
    Write-Output 'Compliant'
    exit 0
}
catch {
    # Detection errors should be visible and should trigger remediation.
    Write-Log $_.Exception.Message 'ERROR'
    Write-Output "Detection error: $($_.Exception.Message)"
    exit 1
}
