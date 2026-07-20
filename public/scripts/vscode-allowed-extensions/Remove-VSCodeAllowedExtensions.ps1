#Requires -Version 5.1

[CmdletBinding()]
param()

$PolicyPath = 'HKLM:\SOFTWARE\Policies\Microsoft\VSCode'
$PolicyName = 'AllowedExtensions'

try {
    if (Test-Path -LiteralPath $PolicyPath) {
        $RegistryKey = Get-Item -LiteralPath $PolicyPath -ErrorAction Stop

        if ($RegistryKey.GetValueNames() -contains $PolicyName) {
            $RemoveValue = @{
                LiteralPath = $PolicyPath
                Name        = $PolicyName
                ErrorAction = 'Stop'
            }
            Remove-ItemProperty @RemoveValue
        }
    }

    Write-Output 'VS Code extension policy registry value is absent.'
    exit 0
}
catch {
    Write-Error "Failed to remove VS Code extension policy: $($_.Exception.Message)"
    exit 1
}
