$rootPath = 'c:\Users\Arpan\Desktop\App & Website\CorpSolver'
$files = Get-ChildItem $rootPath -Include '*.html','*.css','*.js' -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $updated = $content -replace 'Fileng<span>ro</span>', 'Filen<span>gro</span>'

    if ($updated -ne $content) {
        Set-Content $file.FullName $updated -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}
Write-Host "Done!"
