$rootPath = 'c:\Users\Arpan\Desktop\App & Website\CorpSolver'
$files = Get-ChildItem $rootPath -Include '*.html','*.xml','*.css','*.js' -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $updated = $content

    # Fix navbar span markup
    $updated = $updated -replace 'Filen<span>go</span>', 'Fileng<span>ro</span>'

    # Fix alt text
    $updated = $updated -replace 'alt="Filengo"', 'alt="Filengro"'

    # Fix email
    $updated = $updated -replace 'support@filengo\.online', 'support@filengro.in'
    $updated = $updated -replace 'support@filengo\.in', 'support@filengro.in'

    # Fix domain (all variations)
    $updated = $updated -replace 'Filengo\.online', 'Filengro.in'
    $updated = $updated -replace 'filengo\.online', 'filengro.in'
    $updated = $updated -replace 'Filengo\.in', 'Filengro.in'
    $updated = $updated -replace 'filengo\.in', 'filengro.in'

    # Fix brand name (case-sensitive order: uppercase first)
    $updated = $updated -replace 'Filengo', 'Filengro'
    $updated = $updated -replace 'filengo', 'filengro'

    if ($updated -ne $content) {
        Set-Content $file.FullName $updated -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}
Write-Host "Done!"
