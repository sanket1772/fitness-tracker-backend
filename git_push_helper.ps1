Set-Location 'c:\college project\fitness-tracker-MERN-main\server'
$git = 'C:\Program Files\Git\cmd\git.exe'
& $git config user.name 'sanket1772'
& $git config user.email 'sanket1772@users.noreply.github.com'
& $git add . 2>&1 | Out-File gitcmd.txt
& $git commit -m "First commit for backend" 2>&1 | Out-File gitcmd.txt -Append
& $git branch -M main 2>&1 | Out-File gitcmd.txt -Append
& $git remote set-url origin https://github.com/sanket1772/fitness-tracker-backend.git 2>&1 | Out-File gitcmd.txt -Append
& $git push -u origin main 2>&1 | Out-File gitcmd.txt -Append
Get-Content gitcmd.txt
