param([switch]$Remove)
$ErrorActionPreference='Stop'
$projectRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$scriptPath=Join-Path $PSScriptRoot 'public-bootstrap.ps1'
$taskName='BytePathPublicRecovery'
$existing=Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if($existing -and -not($existing.Actions | Where-Object {$_.Arguments -and $_.Arguments.Contains($scriptPath)})){throw 'A different task uses this name; it was left unchanged.'}
if($Remove){
    if($existing){Unregister-ScheduledTask -TaskName $taskName -Confirm:$false}
    'BytePath automatic login task removed; running public processes were left unchanged.'
    return
}
$identity=[Security.Principal.WindowsIdentity]::GetCurrent().Name
$action=New-ScheduledTaskAction -Execute (Join-Path $PSHOME 'powershell.exe') -Argument ('-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "'+$scriptPath+'"') -WorkingDirectory $projectRoot
$logon=New-ScheduledTaskTrigger -AtLogOn -User $identity
$repeat=New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5)
$principal=New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($logon,$repeat) -Principal $principal -Settings $settings -Description 'Resume the approved BytePath connection monitor at login; periodically restore it if stopped unexpectedly. Explicit Stop remains respected.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
'BytePath recovery task installed for this Windows user: login and five-minute monitor check; explicit Stop stays disabled.'
