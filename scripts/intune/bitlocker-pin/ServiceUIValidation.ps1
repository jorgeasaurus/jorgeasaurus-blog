#Requires -Version 5.1
function Assert-ServiceUIBinary {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $nativeArchitecture = $env:PROCESSOR_ARCHITEW6432
    if (-not $nativeArchitecture) { $nativeArchitecture = $env:PROCESSOR_ARCHITECTURE }
    if ($nativeArchitecture -notin @('AMD64','ARM64')) { throw 'This ServiceUI package supports x64 and ARM64 Windows.' }
    $item = Get-Item -LiteralPath $Path -ErrorAction Stop
    if ($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'ServiceUI must be a regular local executable.' }
    $stream = [IO.File]::OpenRead($item.FullName)
    $reader = New-Object IO.BinaryReader $stream
    try {
        if ($reader.ReadUInt16() -ne 0x5A4D) { throw 'ServiceUI is not a PE executable.' }
        $stream.Position = 0x3C
        $offset = $reader.ReadInt32()
        if ($offset -lt 64 -or $offset -gt ($stream.Length - 6)) { throw 'Invalid PE header.' }
        $stream.Position = $offset
        if ($reader.ReadUInt32() -ne 0x4550 -or $reader.ReadUInt16() -ne 0x8664) { throw 'Supply the reviewed x64 ServiceUI build.' }
    } finally { $reader.Dispose(); $stream.Dispose() }
}
