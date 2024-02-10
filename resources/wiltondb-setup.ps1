
param (
  [Parameter(Mandatory=$True)][string]$InstallDir,
  [Parameter(Mandatory=$True)][string]$DataDir,
  [Parameter(Mandatory=$False)][switch]$UpdateHbaConf = $True,
  [Parameter(Mandatory=$False)][switch]$GrantLocalService = $False
)


$ErrorActionPreference = "Stop"
#Set-PSDebug -Trace 1

function Edit-StringUnquoteWilton {
  param (
    [Parameter(Mandatory=$True)][string]$Str
  )
  while (($Str.Length -gt 1) -And 
    ((("`"" -eq $Str.Substring(0, 1)) -And ("`"" -eq $Str.Substring($Str.Length - 1, 1))) -Or 
      (("'" -eq $Str.Substring(0, 1)) -And ("'" -eq $Str.Substring($Str.Length - 1, 1))))) {
    $Str = $Str.Substring(1, $Str.Length - 2)
  }
  return $Str
}

function New-DirWilton {
  param (
    [Parameter(Mandatory=$True)][string]$Dir
  )
  if (-Not (Test-Path -Path $Dir)) {
    New-Item -Path $Dir -ItemType Directory | Out-Null
  }
}

function Write-EventLogWilton {
  param (
    [Parameter(Mandatory=$True)][string]$Message,
    [Parameter(Mandatory=$True)][string]$EntryType
  )
  # https://stackoverflow.com/q/41813955
  Write-EventLog -LogName "Application" -Source "MsiInstaller" -EventId 1013 -EntryType $EntryType -Message "WiltonDB: $Message"
}

function Invoke-CommandWilton {
  param (
    [Parameter(Mandatory=$True)][string]$Exe,
    [Parameter(Mandatory=$True)][string[]]$Args,
    [Parameter(Mandatory=$False)][switch]$NoRedirect,
    [Parameter(Mandatory=$False)][switch]$BestEffort
  )
  Write-Host $Exe $Args
  if (-Not ($NoRedirect)) {
    for ($i = 0; $i -lt $Args.Count; $i++) {
      $Arg = $Args[$i]
      $Args[$i] = "`"$Arg`""
    }
    $Output = cmd.exe /c "`"$Exe`" $Args 2>&1"
  } else {
    $Output = "NOT_CAPTURED"
    & $Exe $Args
  }
  $Message = "`n$Exe $Args`nExit code: $LASTEXITCODE`nOutput:`n$Output"
  if($LASTEXITCODE -eq 0) {
    Write-EventLogWilton -EntryType "Information" -Message $Message
  }
  if (-Not ($NoRedirect)) {
    Write-Host $Output
  }
  if(-Not ($BestEffort) -And ($LASTEXITCODE -ne 0)) {
    throw $Message
  } 
}

function Update-HbaConfWilton {
  param (
    [Parameter(Mandatory=$True)][string]$DataDir
  )
  $PgHbaConf = Join-Path -Path $DataDir -ChildPath "pg_hba.conf"
  $Lines = Get-Content -Path $PgHbaConf
  for ($i = 0; $i -lt $Lines.Count; $i++) {
    if (-Not ($Lines[$i].StartsWith("#")) -And ($Lines[$i].EndsWith("trust"))) {
      $Lines[$i] = $Lines[$i].Replace("trust", "md5")
    }
    if ($Lines[$i].StartsWith("host") -And (-Not ($Lines[$i].Contains("replication")))) {
      $Lines[$i] = $Lines[$i].Replace("127.0.0.1/32", "0.0.0.0/0   ")
      $Lines[$i] = $Lines[$i].Replace("::1/128", "::0/0  ")
    }
  }
  Set-Content -Path $PgHbaConf -Value $Lines
  Write-Host "Updated $PgHbaConf"
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$InstallDir = Edit-StringUnquoteWilton -Str $InstallDir
$DataDir = Edit-StringUnquoteWilton -Str $DataDir

$BinDir = Join-Path -Path $InstallDir -ChildPath "bin"
$LogDir = Join-Path -Path $DataDir -ChildPath "log"
$ShareDir = Join-Path -Path $InstallDir -ChildPath "share"

$InitdbExe = Join-Path -Path $BinDir -ChildPath "initdb.exe"
$PgctlExe = Join-Path -Path $BinDir -ChildPath "pg_ctl.exe"
$PsqlExe = Join-Path -Path $BinDir -ChildPath "psql.exe"
$OpensslExe = Join-Path -Path $BinDir -ChildPath "openssl.exe"
$OpensslCnf = Join-Path -Path $ShareDir -ChildPath "openssl.cnf"
$ServerCrt = Join-Path -Path $DataDir -ChildPath "server.crt"
$ServerKey = Join-Path -Path $DataDir -ChildPath "server.key"
$F01Sql = Join-Path -Path $ScriptDir -ChildPath "wiltondb-setup-01.sql"
$F02Sql = Join-Path -Path $ScriptDir -ChildPath "wiltondb-setup-02.sql"

$PgCtlWasStarted = $False

if ((Test-Path -Path $DataDir) -And ((Get-ChildItem -Path $DataDir | Measure-Object).Count -gt 0)) {
  Write-EventLogWilton -EntryType "Warning" -Message ("Non-empty DB cluster directory already exists on path: $DataDir, skipping initialization." +
    " In case of problems please rename this directory and re-run the installer.")
  exit 0
}

try {
  New-DirWilton -Dir $DataDir
  Invoke-CommandWilton -Exe $InitdbExe -Args @("-D", $DataDir, "-U", "postgres", "-E", "UTF8", "--no-locale", "--no-instructions")
  Invoke-CommandWilton -Exe $OpensslExe -Args @("req", "-config", $OpensslCnf, "-new", "-x509", "-days", "3650",
    "-noenc", "-text", "-batch", "-out", $ServerCrt, "-keyout", $ServerKey, "-subj", "/CN=localhost")
  New-DirWilton -Dir $LogDir
  Invoke-CommandWilton -Exe $PgctlExe -Args @("start", "-D", $DataDir) -NoRedirect
  $PgCtlWasStarted = $True
  Invoke-CommandWilton -Exe $PsqlExe -Args @("-U", "postgres", "-d", "postgres", "-a", "-f", $F01Sql)
  Invoke-CommandWilton -Exe $PgctlExe -Args @("restart", "-D", $DataDir) -NoRedirect
  Invoke-CommandWilton -Exe $PsqlExe -Args @("-U", "postgres", "-d", "wilton", "-a", "-f", $F02Sql)
  Invoke-CommandWilton -Exe $PgctlExe -Args @("stop", "-D", $DataDir) -NoRedirect
  if ($UpdateHbaConf) {
    Update-HbaConfWilton -DataDir $DataDir
  }
  if ($GrantLocalService) {
    Invoke-CommandWilton -Exe "icacls.exe" -Args @($DataDir, "/grant", "*S-1-5-19:(OI)(CI)F", "/t", "/q")
  }
  exit 0
} catch {
  Write-EventLogWilton -EntryType "Error" -Message $_
  Write-Host $_
  if ($PgCtlWasStarted) {
    Invoke-CommandWilton -Exe $PgctlExe -Args @("stop", "-D", $DataDir) -NoRedirect -BestEffort
  }
  exit 1
}
