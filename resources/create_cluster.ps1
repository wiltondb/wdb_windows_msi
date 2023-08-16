
param (
  [Parameter(Mandatory=$true)][string]$BundleDir
)

$ErrorActionPreference = "Stop"
#Set-PSDebug -Trace 1

function Reset-DirWilton {
  param (
    [Parameter(Mandatory=$true)][string]$Dir
  )
  if (Test-Path -Path $Dir) {
    Remove-Item -Recurse -Force -Path $Dir
  }
  if (Test-Path -Path $Dir) {
    throw "Remove directory error, path: [$Dir]"
  }
  New-Item -Path $Dir -ItemType Directory | Out-Null
}

function Invoke-CommandWilton {
  param (
    [Parameter(Mandatory=$true)][string]$Exe,
    [Parameter(Mandatory=$true)][string[]]$Args
  )
  Write-Host $Exe $Args
  & $Exe $Args
  if($LASTEXITCODE -ne 0)
  {
    throw "Exit code error, command: [$Exe $Args], code: [$LASTEXITCODE]"
  } 
}

function Update-HbaConfWilton {
  param (
    [Parameter(Mandatory=$true)][string]$DataDir
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
$BinDir = Join-Path -Path $BundleDir -ChildPath "bin"
$DataDir = Join-Path -Path $BundleDir -ChildPath "data"
$LogDir = Join-Path -Path $DataDir -ChildPath "log"
$ShareDir = Join-Path -Path $BundleDir -ChildPath "share"

$InitdbExe = Join-Path -Path $BinDir -ChildPath "initdb.exe"
$PgctlExe = Join-Path -Path $BinDir -ChildPath "pg_ctl.exe"
$PsqlExe = Join-Path -Path $BinDir -ChildPath "psql.exe"
$OpensslExe = Join-Path -Path $BinDir -ChildPath "openssl.exe"
$OpensslCnf = Join-Path -Path $ShareDir -ChildPath "openssl.cnf"
$ServerCrt = Join-Path -Path $DataDir -ChildPath "server.crt"
$ServerKey = Join-Path -Path $DataDir -ChildPath "server.key"
$F01AlterSystemCreateDbSql = Join-Path -Path $ScriptDir -ChildPath "01_alter_system_create_db.sql"
$F02CreateExtension = Join-Path -Path $ScriptDir -ChildPath "02_create_extension.sql"

Reset-DirWilton -Dir $DataDir
Invoke-CommandWilton -Exe $InitdbExe -Args @("-D", $DataDir, "-U", "postgres", "-E", "UTF8", "--no-locale")
Invoke-CommandWilton -Exe $OpensslExe -Args @("req", "-config", $OpensslCnf, "-new", "-x509", "-days", "3650",
  "-nodes", "-text", "-out", $ServerCrt, "-keyout", $ServerKey, "-subj", "/CN=localhost")
Reset-DirWilton -Dir $LogDir
Invoke-CommandWilton -Exe $PgctlExe -Args @("start", "-D", $DataDir)
Invoke-CommandWilton -Exe $PsqlExe -Args @("-U", "postgres", "-d", "postgres", "-f", $F01AlterSystemCreateDbSql)
Invoke-CommandWilton -Exe $PgctlExe -Args @("restart", "-D", $DataDir)
Invoke-CommandWilton -Exe $PsqlExe -Args @("-U", "postgres", "-d", "wilton", "-f", $F02CreateExtension)
Invoke-CommandWilton -Exe $PgctlExe -Args @("stop", "-D", $DataDir)
Update-HbaConfWilton -DataDir $DataDir
