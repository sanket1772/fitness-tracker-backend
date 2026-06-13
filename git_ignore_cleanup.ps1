Set-Location 'c:\college project\fitness-tracker-MERN-main\server'
$git = 'C:\Program Files\Git\cmd\git.exe'
Remove-Item -Path git_ignore_cleanup_log.txt, stdout.txt, stderr.txt -ErrorAction SilentlyContinue
function RunGit([string[]]$args) {
    "CMD: git $($args -join ' ')" | Out-File git_ignore_cleanup_log.txt -Append
    $process = Start-Process -FilePath $git -ArgumentList $args -NoNewWindow -RedirectStandardOutput stdout.txt -RedirectStandardError stderr.txt -Wait -PassThru
    if (Test-Path stdout.txt) { Get-Content stdout.txt | Out-File git_ignore_cleanup_log.txt -Append }
    if (Test-Path stderr.txt) { Get-Content stderr.txt | Out-File git_ignore_cleanup_log.txt -Append }
}
RunGit @('rm','-r','--cached','node_modules','.env')
RunGit @('add','.')
RunGit @('commit','-m','Remove node_modules and .env from repository')
RunGit @('push')
Get-Content git_ignore_cleanup_log.txt
