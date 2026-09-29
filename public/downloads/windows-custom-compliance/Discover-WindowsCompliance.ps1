# Run in 64-bit Windows PowerShell as SYSTEM.
$ErrorActionPreference = 'Stop'

# Replace these values with the app's exact uninstall registration values.
$requiredAppName = 'Contoso Secure Client'
$requiredPublisher = 'Contoso'
$uninstallRoots = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall'
    'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall'
)

$matchingApps = @(
    foreach ($root in $uninstallRoots) {
        if (Test-Path -LiteralPath $root) {
            Get-ItemProperty -Path "$root\*" | Where-Object {
                $name = $_.PSObject.Properties['DisplayName']
                $publisher = $_.PSObject.Properties['Publisher']
                $null -ne $name -and $null -ne $publisher -and
                    $name.Value -eq $requiredAppName -and
                    $publisher.Value -eq $requiredPublisher
            }
        }
    }
)

$volume = Get-BitLockerVolume -MountPoint $env:SystemDrive
if ($null -eq $volume) {
    throw 'The operating system volume could not be read.'
}
$protectorTypes = @(
    $volume.KeyProtector | ForEach-Object { [string]$_.KeyProtectorType }
)
$pinBaselineMet = (
    $volume.VolumeStatus -eq 'FullyEncrypted' -and
    $volume.ProtectionStatus -eq 'On' -and
    $protectorTypes -contains 'TpmPin' -and
    $protectorTypes -notcontains 'Tpm' -and
    $protectorTypes -notcontains 'TpmStartupKey'
)

$result = @{
    RequiredAppRegistered = [bool]($matchingApps.Count -gt 0)
    BitLockerPinBaselineMet = [bool]$pinBaselineMet
}
return $result | ConvertTo-Json -Compress
