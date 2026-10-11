#Requires -Version 5.1
Set-StrictMode -Version Latest
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
        -not $policy.PSObject.Properties['UseTPMPIN'] -or $policy.UseTPMPIN -notin @(1,2)) {
        throw 'BitLocker policy must enable advanced startup authentication and allow or require TPM+PIN.'
    }
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
Export-ModuleMember -Function Get-PinEnrollmentState, Add-StartupPin, Test-PinEnrollmentComplete
