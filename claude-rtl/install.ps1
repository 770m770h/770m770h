<#
    claude-rtl — one-line installer.

    Run this and nothing else is needed:

      irm https://raw.githubusercontent.com/770m770h/770m770h/refs/heads/claude/hebrew-rtl-display-z6f81n/claude-rtl/install.ps1 | iex

    It downloads the launcher into %LOCALAPPDATA%\claude-rtl, puts a
    "Claude (RTL)" shortcut on the Desktop, and starts Claude with Hebrew and
    Arabic reading right to left.

    Nothing inside Claude Desktop is modified. No administrator rights, no
    certificates, no changes that a Claude update could break. Deleting the
    folder and the shortcut removes every trace.
#>

$ErrorActionPreference = 'Stop'

$Branch  = 'refs/heads/claude/hebrew-rtl-display-z6f81n'
$BaseUrl = "https://raw.githubusercontent.com/770m770h/770m770h/$Branch/claude-rtl"
$Dest    = Join-Path $env:LOCALAPPDATA 'claude-rtl'

function Write-Step { param([string]$Text) Write-Host "  $Text" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Text) Write-Host "  $Text" -ForegroundColor Green }
function Write-Bad  { param([string]$Text) Write-Host "  $Text" -ForegroundColor Red }

Write-Host ""
Write-Host "  Claude RTL - Hebrew and Arabic support" -ForegroundColor White
Write-Host "  --------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# Windows PowerShell 5.1 still defaults to TLS 1.0, which GitHub refuses.
try {
    [Net.ServicePointManager]::SecurityProtocol =
        [Net.SecurityProtocolType]::Tls12 -bor [Net.ServicePointManager]::SecurityProtocol
} catch { }

# ---------------------------------------------------------------- download

$files = @(
    @{ Url = "$BaseUrl/windows/claude-rtl.ps1";      Path = 'windows\claude-rtl.ps1' },
    @{ Url = "$BaseUrl/dist/claude-rtl.bundle.js";   Path = 'dist\claude-rtl.bundle.js' }
)

Write-Step "Downloading..."
foreach ($f in $files) {
    $target = Join-Path $Dest $f.Path
    $dir    = Split-Path -Parent $target
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    try {
        Invoke-WebRequest -Uri $f.Url -OutFile $target -UseBasicParsing
    } catch {
        Write-Bad "Download failed: $($f.Url)"
        Write-Bad $_.Exception.Message
        Write-Host ""
        Write-Host "  Check your internet connection and run the command again."
        return
    }
}

$payload = Join-Path $Dest 'dist\claude-rtl.bundle.js'
$script  = Join-Path $Dest 'windows\claude-rtl.ps1'

if (-not (Test-Path $payload) -or (Get-Item $payload).Length -lt 5000) {
    Write-Bad "The downloaded file looks wrong. Nothing was installed."
    return
}
if (-not (Select-String -Path $payload -Pattern '__claudeRtlInstalled' -Quiet)) {
    Write-Bad "The downloaded file is not the expected one. Nothing was installed."
    return
}
Write-Ok "Downloaded to $Dest"

# ---------------------------------------------------------------- shortcut

try {
    $desktop  = [Environment]::GetFolderPath('Desktop')
    $lnk      = Join-Path $desktop 'Claude (RTL).lnk'
    $shell    = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($lnk)
    $shortcut.TargetPath = (Get-Command powershell.exe).Source
    $shortcut.Arguments  = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`" -Watch"
    $shortcut.WorkingDirectory = Split-Path -Parent $script
    $shortcut.Description = 'Claude Desktop with Hebrew/Arabic RTL support'
    $shortcut.Save()
    Write-Ok "Desktop shortcut created: Claude (RTL)"
} catch {
    Write-Host "  (Could not create the shortcut - not fatal.)" -ForegroundColor Yellow
}

# ------------------------------------------------------------------- start

Write-Host ""
Write-Step "Starting Claude..."
Write-Host ""

& $script -Watch
