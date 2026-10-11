#Requires -Version 5.1
function Import-PinLogo {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $file = Get-Item -LiteralPath $Path -ErrorAction Stop
    if ($file.PSIsContainer -or $file.Extension.ToLowerInvariant() -notin @('.png','.jpg','.jpeg')) {
        throw 'Logo must be a local PNG or JPEG file. Recommended: transparent 256x256 PNG.'
    }
    if ($file.Length -gt 2MB) { throw 'Logo must be no larger than 2 MB.' }
    $stream = [IO.File]::OpenRead($file.FullName)
    try {
        $decoder = [Windows.Media.Imaging.BitmapDecoder]::Create(
            $stream, [Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat,
            [Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
        if ($decoder -isnot [Windows.Media.Imaging.PngBitmapDecoder] -and
            $decoder -isnot [Windows.Media.Imaging.JpegBitmapDecoder]) { throw 'Logo content must be PNG or JPEG.' }
        $bitmap = $decoder.Frames[0]
        if ($bitmap.PixelWidth -lt 64 -or $bitmap.PixelWidth -gt 2048 -or
            $bitmap.PixelHeight -lt 64 -or $bitmap.PixelHeight -gt 2048) {
            throw 'Each logo side must be 64-2048 pixels. Recommended: transparent 256x256 PNG.'
        }
        $bitmap.Freeze()
        return $bitmap
    } finally { $stream.Dispose() }
}
