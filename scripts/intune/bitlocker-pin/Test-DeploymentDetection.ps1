#Requires -Version 5.1
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$temporary = Join-Path ([IO.Path]::GetTempPath()) ('PinDetection-' + [guid]::NewGuid())
$null = New-Item -ItemType Directory -Path $temporary
function Quote-Literal([string]$Value) { return "'" + $Value.Replace("'", "''") + "'" }
try {
    $cases = @('Complete','Recovery only','TPM only','Protection off','Encryption incomplete','PIN with TPM bypass','Missing recovery','Duplicate PIN','Unknown protector','Locked','Data drive')
    foreach ($case in $cases) {
        $types = @('TpmPin','RecoveryPassword'); $protection = 'On'; $encryption = 'FullyEncrypted'; $lock = 'Unlocked'; $kind = 'OperatingSystem'
        switch ($case) {
            'Recovery only' { $types = @('RecoveryPassword') }
            'TPM only' { $types = @('Tpm','RecoveryPassword') }
            'Protection off' { $protection = 'Off' }
            'Encryption incomplete' { $encryption = 'EncryptionInProgress' }
            'PIN with TPM bypass' { $types += 'Tpm' }
            'Missing recovery' { $types = @('TpmPin') }
            'Duplicate PIN' { $types += 'TpmPin' }
            'Unknown protector' { $types += 'Password' }
            'Locked' { $lock = 'Locked' }
            'Data drive' { $kind = 'FixedData' }
        }
        $fixture = Join-Path $temporary 'Volume.xml'
        [pscustomobject]@{VolumeType=$kind; VolumeStatus=$encryption; ProtectionStatus=$protection; LockStatus=$lock; KeyProtector=@($types | ForEach-Object { [pscustomobject]@{KeyProtectorType=$_} })} | Export-Clixml $fixture
        $detector = Join-Path $PSScriptRoot 'Test-BitLockerPinInstalled.ps1'
        $command = 'function Get-BitLockerVolume { param($MountPoint) Import-Clixml ' + (Quote-Literal $fixture) + ' }; & ' + (Quote-Literal $detector)
        $output = & ([Diagnostics.Process]::GetCurrentProcess().MainModule.FileName) -NoProfile -ExecutionPolicy Bypass -EncodedCommand ([Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($command)))
        $expected = 1; if ($case -eq 'Complete') { $expected = 0 }
        if ($LASTEXITCODE -ne $expected -or ($expected -eq 0 -and -not $output) -or ($expected -ne 0 -and $output)) { throw "Detection failed: $case" }
    }
    Write-Output 'PASS: 11 PIN completion detection fixtures.'
} finally { Remove-Item $temporary -Recurse -Force }
