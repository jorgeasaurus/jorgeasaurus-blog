#Requires -Version 5.1

<#
.SYNOPSIS
    Example Intune Remediation remediation script.
.DESCRIPTION
    Sets HKLM:\SOFTWARE\Company\Example\Configured to 1 and verifies the result.
    Exit 0 means remediation succeeded. Exit 1 means remediation failed.
#>

[CmdletBinding()]
param()

# Stop on command errors so the catch block can log and return a failed exit code.
$ErrorActionPreference = 'Stop'

# Write detailed troubleshooting logs beside the native Intune Management Extension logs.
# This makes the custom logs available when collecting diagnostics from Intune.
$LogRoot = Join-Path $env:ProgramData 'Microsoft\IntuneManagementExtension\Logs'
$LogPath = Join-Path $LogRoot 'Company-ExampleRemediation-Remediate.log'

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

function Assert-Running64BitPowerShell {
    [CmdletBinding()]
    param()

    # Relaunch from SysNative when Intune starts the script in 32-bit PowerShell.
    if ([Environment]::Is64BitOperatingSystem -and -not [Environment]::Is64BitProcess) {
        $powerShell64 = Join-Path $env:WINDIR 'SysNative\WindowsPowerShell\v1.0\powershell.exe'

        if (Test-Path -Path $powerShell64) {
            Write-Log 'Relaunching remediation in 64-bit PowerShell.'

            # Run this same script in 64-bit PowerShell and return that process exit code.
            $process = Start-Process -FilePath $powerShell64 -ArgumentList @(
                '-NoProfile'
                '-ExecutionPolicy'
                'Bypass'
                '-File'
                "`"$PSCommandPath`""
            ) -Wait -PassThru

            exit $process.ExitCode
        }
    }
}

try {
    Assert-Running64BitPowerShell

    # Replace these three values with the setting your remediation owns.
    $registryPath = 'HKLM:\SOFTWARE\Company\Example'
    $valueName = 'Configured'
    $expectedValue = '1'

    # Create the parent registry path before writing the desired value.
    if (-not (Test-Path -Path $registryPath)) {
        New-Item -Path $registryPath -Force | Out-Null
        Write-Log "Created registry path: $registryPath"
    }

    # Apply the desired state. This is the actual remediation action.
    New-ItemProperty -Path $registryPath -Name $valueName -Value $expectedValue -PropertyType String -Force | Out-Null
    Write-Log "Set $registryPath\$valueName to '$expectedValue'."

    # Verify the remediation before reporting success to Intune.
    $actualValue = (Get-ItemProperty -Path $registryPath -Name $valueName -ErrorAction Stop).$valueName

    if ($actualValue -ne $expectedValue) {
        throw "Verification failed. Expected '$expectedValue', found '$actualValue'."
    }

    # Exit 0 tells Intune the remediation completed successfully.
    Write-Output 'Remediation completed'
    exit 0
}
catch {
    # Exit 1 tells Intune remediation failed and preserves the useful error locally.
    Write-Log $_.Exception.Message 'ERROR'
    Write-Output "Remediation error: $($_.Exception.Message)"
    exit 1
}
