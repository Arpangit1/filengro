$src = 'C:\Users\Arpan\.gemini\antigravity\brain\88a581ac-da62-44a6-85c9-038e074fc057\media__1779853110700.png'
$dest = 'c:\Users\Arpan\Desktop\App & Website\CorpSolver\images'

Copy-Item $src "$dest\logo.png" -Force
Copy-Item $src "$dest\favicon.png" -Force

Write-Host 'Done! logo.png and favicon.png updated.'
Get-ChildItem $dest | Select-Object Name, Length, LastWriteTime
