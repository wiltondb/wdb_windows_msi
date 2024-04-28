#
# Copyright 2024, WiltonDB Software
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

param (
  [Parameter(Mandatory=$True)][string]$DataDir,
  [Parameter(Mandatory=$False)][string]$InstallDir = "",
  [Parameter(Mandatory=$False)][string]$Locale = "C",
  [Parameter(Mandatory=$False)][switch]$EnableLoggingCollector = $True,
  [Parameter(Mandatory=$False)][string]$LogDirectory = "log",
  [Parameter(Mandatory=$False)][string]$LogFileName = "postgresql-%a.log",
  [Parameter(Mandatory=$False)][int]$PostgresPort = 5432,
  [Parameter(Mandatory=$False)][int]$TdsPort = 1433,
  [Parameter(Mandatory=$False)][int]$MaxConnections = 256,
  [Parameter(Mandatory=$False)][switch]$EnableSSL = $False,
  [Parameter(Mandatory=$False)][string]$UserName = "wilton",
  [Parameter(Mandatory=$False)][string]$UserPassword = "wilton",
  [Parameter(Mandatory=$False)][string]$DatabaseName = "wilton",
  [Parameter(Mandatory=$False)][string]$MigrationMode = "multi-db",
  [Parameter(Mandatory=$False)][switch]$UpdateHbaConf = $True,
  [Parameter(Mandatory=$False)][switch]$GrantLocalService = $False,
  [Parameter(Mandatory=$False)][switch]$EnableEventLog = $False
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

function Convert-SwitchWilton {
  param (
    [Parameter(Mandatory=$True)][bool]$Switch
  )
  if ($Switch) {
    return "ON"
  } else {
    return "OFF"
  }
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
  if ($EnableEventLog) {
    # https://stackoverflow.com/q/41813955
    Write-EventLog -LogName "Application" -Source "MsiInstaller" -EventId 1013 -EntryType $EntryType -Message "WiltonDB: $Message"
  }
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

$ScriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
if (0 -eq $InstallDir.Length) {
  $InstallDir = Split-Path -Path (Split-Path -Path $ScriptDir -Parent) -Parent
} else {
  $InstallDir = Resolve-Path -Path (Edit-StringUnquoteWilton -Str $InstallDir)
}
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
  $Msg = ("Non-empty DB cluster directory already exists on path: $DataDir, skipping initialization." +
    " In case of problems please rename this directory and re-run the installer.")
  Write-EventLogWilton -EntryType "Warning" -Message $Msg
  Write-Host $Msg
  exit 0
}

try {
  New-DirWilton -Dir $DataDir
  Invoke-CommandWilton -Exe $InitdbExe -Args @("-D", $DataDir, "-U", "postgres", "-E", "UTF8", "--locale=$Locale", "--no-instructions")
  if ($EnableSSL) {
    Invoke-CommandWilton -Exe $OpensslExe -Args @("req", "-config", $OpensslCnf, "-new", "-x509", "-days", "3650",
      "-noenc", "-text", "-batch", "-out", $ServerCrt, "-keyout", $ServerKey, "-subj", "/CN=localhost")
  }
  New-DirWilton -Dir $LogDir
  Invoke-CommandWilton -Exe $PgctlExe -Args @("-o", "`"-p $PostgresPort`"", "start", "-D", $DataDir) -NoRedirect
  $PgCtlWasStarted = $True
  Invoke-CommandWilton -Exe $PsqlExe -Args @("-p", $PostgresPort, "-U", "postgres", "-d", "postgres", "-a", "-f", $F01Sql,
    "-v", "enable_logging_collector=$(Convert-SwitchWilton -Switch $EnableLoggingCollector)",
    "-v", "log_directory='$LogDirectory'",
    "-v", "log_filename='$LogFileName'",
    "-v", "postgres_port=$PostgresPort",
    "-v", "max_connections=$MaxConnections",
    "-v", "enable_ssl=$(Convert-SwitchWilton -Switch $EnableSSL)",
    "-v", "username=$UserName",
    "-v", "username_quoted='$UserName'",
    "-v", "user_password='$UserPassword'",
    "-v", "dbname=$DatabaseName",
    "-v", "dbname_quoted='$DatabaseName'"
  )
  Invoke-CommandWilton -Exe $PgctlExe -Args @("restart", "-D", $DataDir) -NoRedirect
  Invoke-CommandWilton -Exe $PsqlExe -Args @("-p", $PostgresPort, "-U", "postgres", "-d", $DatabaseName, "-a", "-f", $F02Sql,
    "-v", "username=$UserName",
    "-v", "username_quoted='$UserName'",
    "-v", "tds_port=$TdsPort",
    "-v", "dbname=$DatabaseName",
    "-v", "dbname_quoted='$DatabaseName'",
    "-v", "migration_mode='$MigrationMode'"
  )
  Invoke-CommandWilton -Exe $PgctlExe -Args @("stop", "-D", $DataDir) -NoRedirect
  if ($UpdateHbaConf) {
    Update-HbaConfWilton -DataDir $DataDir
  }
  if ($GrantLocalService) {
    Invoke-CommandWilton -Exe "icacls.exe" -Args @($DataDir, "/grant", "*S-1-5-19:(OI)(CI)F", "/t", "/q")
  }
  Write-Host "Setup complete, use '`"$InstallDir\bin\pg_ctl.exe`" start -D `"$(Resolve-Path -Path $DataDir)`"' to start the server."
  exit 0
} catch {
  Write-EventLogWilton -EntryType "Error" -Message $_
  Write-Host $_
  if ($PgCtlWasStarted) {
    Invoke-CommandWilton -Exe $PgctlExe -Args @("stop", "-D", $DataDir) -NoRedirect -BestEffort
  }
  exit 1
}
