Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*backend*server.js*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Output ("killed " + $_.ProcessId) }
