$rootPath = 'c:\Users\Arpan\Desktop\App & Website\CorpSolver'
$files = Get-ChildItem $rootPath -Include '*.html' -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    # Replace the old inline style on logo img tags
    $updated = $content -replace 'style="height:40px;width:auto;object-fit:contain;vertical-align:middle;margin-right:8px;"', 'class="logo-img"'

    if ($updated -ne $content) {
        Set-Content $file.FullName $updated -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}
Write-Host "Done!"
