#Requires -Version 5.1

[CmdletBinding()]
param()

function ConvertTo-VSCodeAllowedExtensionsJson {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [System.Collections.IDictionary]$AllowedExtensions
    )

    $VersionPattern = '^\d+\.\d+\.\d+(-.*)?(@.+)?$'

    foreach ($Entry in $AllowedExtensions.GetEnumerator()) {
        $Selector = [string]$Entry.Key
        $Rule = $Entry.Value

        if ([string]::IsNullOrWhiteSpace($Selector)) {
            throw 'Extension selectors cannot be empty.'
        }

        if ($Selector -ne '*' -and $Selector.Contains('*')) {
            throw "Selector '$Selector' contains an unsupported wildcard."
        }

        if ($Selector -eq '*' -and $Rule -isnot [bool]) {
            throw "Selector '*' must use a Boolean rule."
        }

        if ($Rule -is [bool]) {
            continue
        }

        if ($Rule -is [string]) {
            if ($Rule -ceq 'stable') {
                continue
            }

            throw "Selector '$Selector' must use the exact string 'stable', not '$Rule'."
        }

        if ($Rule -is [System.Array]) {
            if (-not $Selector.Contains('.')) {
                throw "Exact-version arrays require a full extension ID, not publisher '$Selector'."
            }

            $Versions = @($Rule)
            if ($Versions.Count -eq 0) {
                throw "Selector '$Selector' has an empty version array."
            }

            foreach ($Version in $Versions) {
                if ($Version -isnot [string] -or $Version -cnotmatch $VersionPattern) {
                    throw "Selector '$Selector' contains an invalid exact version."
                }
            }

            continue
        }

        throw "Selector '$Selector' must use a Boolean, 'stable', or an exact-version array."
    }

    return ($AllowedExtensions | ConvertTo-Json -Compress -Depth 10)
}

$PolicyPath = 'HKLM:\SOFTWARE\Policies\Microsoft\VSCode'
$PolicyName = 'AllowedExtensions'
$AllowedExtensions = [ordered]@{
    '*'                       = $false
    'ms-vscode.powershell'    = 'stable'
    'ms-python.python'        = 'stable'
    'dbaeumer.vscode-eslint'  = 'stable'
    'esbenp.prettier-vscode'  = 'stable'
    'github.copilot'          = 'stable'
    'github.copilot-chat'     = 'stable'
}

try {
    $AllowedExtensionsJson = ConvertTo-VSCodeAllowedExtensionsJson -AllowedExtensions $AllowedExtensions
}
catch {
    Write-Output "Desired VS Code extension configuration is invalid: $($_.Exception.Message)"
    exit 1
}

try {
    if (-not (Test-Path -LiteralPath $PolicyPath)) {
        Write-Output 'VS Code extension policy is missing.'
        exit 1
    }

    $RegistryKey = Get-Item -LiteralPath $PolicyPath -ErrorAction Stop
    $ValueKind = $RegistryKey.GetValueKind($PolicyName)

    if ($ValueKind -ne [Microsoft.Win32.RegistryValueKind]::MultiString) {
        Write-Output "VS Code extension policy has the wrong registry type: $ValueKind."
        exit 1
    }

    $GetValue = @{
        LiteralPath = $PolicyPath
        Name        = $PolicyName
        ErrorAction = 'Stop'
    }
    $Value = Get-ItemPropertyValue @GetValue

    $CurrentJson = [string]::Join(
        [Environment]::NewLine,
        [string[]]$Value
    )
    $CurrentJson = ($CurrentJson | ConvertFrom-Json -ErrorAction Stop) |
        ConvertTo-Json -Compress -Depth 10

    if ($CurrentJson -ceq $AllowedExtensionsJson) {
        Write-Output 'VS Code extension policy registry value matches the desired configuration.'
        exit 0
    }

    Write-Output 'VS Code extension policy has drifted.'
    exit 1
}
catch {
    Write-Output "VS Code extension policy is missing or invalid: $($_.Exception.Message)"
    exit 1
}
