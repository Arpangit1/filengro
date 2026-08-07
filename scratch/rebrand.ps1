$rootPath = 'c:\Users\Arpan\Desktop\App & Website\CorpSolver'
$files = Get-ChildItem $rootPath -Include '*.html','*.xml','*.css','*.js' -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $updated = $content
    $updated = $updated -replace 'Corp<span>Solver</span>', 'Filen<span>go</span>'
    $updated = $updated -replace 'alt="CorpSolver"', 'alt="Filengo"'
    $updated = $updated -replace 'support@corpsolver\.online', 'support@filengo.online'
    $updated = $updated -replace 'CorpSolver\.online', 'Filengo.online'
    $updated = $updated -replace 'corpsolver\.online', 'filengo.online'
    $updated = $updated -replace 'CorpSolver', 'Filengo'
    $updated = $updated -replace 'corpsolver', 'filengo'

    if ($updated -ne $content) {
        Set-Content $file.FullName $updated -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}
Write-Host "Done!"
