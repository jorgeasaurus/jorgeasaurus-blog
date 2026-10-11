. (Join-Path $PSScriptRoot 'Uninstall-BitLockerPin.ps1')
function Get-BitLockerVolume { param($MountPoint) $script:v }
function Get-ItemProperty { param($LiteralPath) $script:policy }
function Get-CimInstance { param($Namespace,$ClassName,$Filter) [pscustomobject]@{Id='volume'} }
function Invoke-CimMethod { param($InputObject,$MethodName,$Arguments)
 $script:adds++; if($script:failAdd){return @{ReturnValue=1}}
 $script:v.KeyProtector+= [pscustomobject]@{KeyProtectorType='Tpm';KeyProtectorId='tpm'}
 @{ReturnValue=0}
}
function Remove-BitLockerKeyProtector { param($MountPoint,$KeyProtectorId)
 if($KeyProtectorId -ne 'pin'){throw 'Wrong protector removed'}
 $script:removes++;$script:v.KeyProtector=@($script:v.KeyProtector|Where-Object KeyProtectorId -ne $KeyProtectorId)
}
foreach($case in @('normal','existingTpm','requiredPin','blockedTpm','missingRecovery','failedAdd','noPin')){
 $script:adds=0;$script:removes=0;$script:failAdd=$case -eq 'failedAdd'
 $script:policy=[pscustomobject]@{UseAdvancedStartup=1;UseTPMPIN=2;UseTPM=2}
 $script:v=[pscustomobject]@{VolumeType='OperatingSystem';VolumeStatus='FullyEncrypted';LockStatus='Unlocked';ProtectionStatus='On';KeyProtector=@([pscustomobject]@{KeyProtectorType='TpmPin';KeyProtectorId='pin'},[pscustomobject]@{KeyProtectorType='RecoveryPassword';KeyProtectorId='recovery'})}
 if($case -eq 'existingTpm'){$v.KeyProtector+=[pscustomobject]@{KeyProtectorType='Tpm';KeyProtectorId='tpm'}}
 if($case -eq 'requiredPin'){$policy.UseTPMPIN=1}
 if($case -eq 'blockedTpm'){$policy.UseTPM=0}
 if($case -eq 'missingRecovery'){$v.KeyProtector=@($v.KeyProtector|Where-Object KeyProtectorType -ne 'RecoveryPassword')}
 if($case -eq 'noPin'){$v.KeyProtector=@($v.KeyProtector|Where-Object KeyProtectorType -ne 'TpmPin')}
 $failed=$false;try{Remove-PilotStartupPin -MountPoint C:}catch{$failed=$true}
 $expectedFail=$case -in @('requiredPin','blockedTpm','missingRecovery','failedAdd')
 if($failed -ne $expectedFail){throw "Unexpected result $case"}
 if(($expectedFail -or $case -eq 'noPin') -and $removes -ne 0){throw "Unsafe removal $case"}
 if($case -in @('normal','existingTpm') -and ($removes -ne 1 -or 'recovery' -notin $v.KeyProtector.KeyProtectorId)){throw 'Recovery preservation failure'}
}
'PASS: seven mocked uninstall transaction cases; no real protector changes.'
