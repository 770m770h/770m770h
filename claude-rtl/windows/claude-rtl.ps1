<#
.SYNOPSIS
    Adds Hebrew/Arabic RTL rendering to Claude Desktop on Windows without
    modifying a single file inside the installation.

.DESCRIPTION
    Starts Claude Desktop with Chromium's remote debugging port enabled and
    injects the RTL payload over the DevTools Protocol.

    Compared with patching app.asar this changes nothing on disk: the digital
    signature stays intact, no certificate is installed, and a Claude update
    does not undo anything. Stop using this launcher and the app is exactly as
    it shipped.

    The trade-off: while Claude runs this way it listens on a loopback
    debugging port, and any program running as your user could attach to it.
    The port is bound to 127.0.0.1 and closes when Claude exits.

.PARAMETER Port
    Debugging port. Default 9222.

.PARAMETER Watch
    Keep running and inject into windows opened later. Recommended.

.PARAMETER Diagnose
    Report what the script can see and exit. Use this first if injection fails.

.PARAMETER CreateShortcut
    Put a "Claude (RTL)" shortcut on the Desktop that runs this script.

.EXAMPLE
    .\claude-rtl.ps1 -Watch
#>
[CmdletBinding()]
param(
    [int]$Port = 9222,
    [switch]$Watch,
    [switch]$Diagnose,
    [switch]$CreateShortcut,
    [string]$PayloadPath
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 1.0

# --------------------------------------------------------------- discovery

# Claude Desktop now ships as an MSIX / Microsoft Store package. Its executable
# lives under C:\Program Files\WindowsApps\Claude_<ver>_x64__<hash>\app\Claude.exe
# — a directory the legacy folder search below never looks in, and whose name
# carries a version and a hash we cannot guess. Ask the package manager instead.
function Find-ClaudeExeMsix {
    try {
        $pkg = Get-AppxPackage -Name 'Claude' -ErrorAction SilentlyContinue |
            Where-Object { $_.PackageFamilyName -like 'Claude_*' -and -not $_.IsFramework } |
            Sort-Object { try { [version]$_.Version } catch { [version]'0.0.0' } } -Descending |
            Select-Object -First 1
        if ($pkg -and $pkg.InstallLocation) {
            foreach ($rel in @('app\Claude.exe', 'Claude.exe')) {
                $exe = Join-Path $pkg.InstallLocation $rel
                if (Test-Path $exe) { return $exe }
            }
        }
    } catch { }
    return $null
}

function Find-ClaudeExe {
    # Current distribution first: the Store/MSIX build.
    $msix = Find-ClaudeExeMsix
    if ($msix) { return $msix }

    # Legacy Squirrel/NSIS install (%LOCALAPPDATA%\AnthropicClaude\app-x.y.z).
    $bases = @(
        $env:LOCALAPPDATA,
        $env:PROGRAMFILES,
        ${env:ProgramFiles(x86)}
    ) | Where-Object { $_ }

    $roots = @()
    foreach ($b in $bases) {
        foreach ($name in @('AnthropicClaude', 'Claude')) {
            $candidate = Join-Path $b $name
            if (Test-Path $candidate) { $roots += $candidate }
        }
    }
    $roots = $roots | Select-Object -Unique

    foreach ($root in $roots) {
        # Prefer the versioned app-x.y.z\claude.exe over the Squirrel stub in
        # the root, because the stub does not forward command-line arguments.
        $versioned = Get-ChildItem -Path $root -Directory -Filter 'app-*' -ErrorAction SilentlyContinue |
            Sort-Object {
                $v = $_.Name -replace '^app-', ''
                try { [version]($v -replace '[^0-9.].*$', '') } catch { [version]'0.0.0' }
            } -Descending

        foreach ($dir in $versioned) {
            $exe = Join-Path $dir.FullName 'claude.exe'
            if (Test-Path $exe) { return $exe }
        }

        $direct = Join-Path $root 'claude.exe'
        if (Test-Path $direct) { return $direct }
    }
    return $null
}

# Only the Claude *Desktop* processes — never the Claude Code CLI, which is also
# named claude.exe and would otherwise be killed by a blanket Get-Process. We
# scope by executable path: the Desktop app runs from its install directory,
# the CLI runs from %APPDATA%\Claude\claude-code or a VS Code extension folder.
function Get-ClaudeDesktopProcess {
    $exe = Find-ClaudeExe
    $installDir = if ($exe) { Split-Path -Parent $exe } else { $null }
    return @(Get-Process -Name 'claude' -ErrorAction SilentlyContinue | Where-Object {
        $p = $null
        try { $p = $_.Path } catch { $p = $null }
        if (-not $p) { return $false }
        if ($installDir -and $p.StartsWith($installDir, [StringComparison]::OrdinalIgnoreCase)) { return $true }
        # Fallbacks for installs we could not resolve to an exe.
        return ($p -like '*\WindowsApps\Claude_*\*' -or $p -like '*\AnthropicClaude\*')
    })
}

function Get-Payload {
    if ($PayloadPath) {
        if (-not (Test-Path $PayloadPath)) { throw "Payload not found: $PayloadPath" }
        return [System.IO.File]::ReadAllText($PayloadPath, [System.Text.Encoding]::UTF8)
    }
    $local = Join-Path (Split-Path -Parent $PSCommandPath) '..\dist\claude-rtl.bundle.js'
    $local = [System.IO.Path]::GetFullPath($local)
    if (Test-Path $local) {
        return [System.IO.File]::ReadAllText($local, [System.Text.Encoding]::UTF8)
    }
    throw "Could not find dist\claude-rtl.bundle.js. Run: node src\build.js"
}

# --------------------------------------------------------- devtools protocol

function Test-DebugPort {
    param([int]$P)
    try {
        $r = Invoke-RestMethod -Uri "http://127.0.0.1:$P/json/version" -TimeoutSec 2
        return $r
    } catch { return $null }
}

# Claude Desktop 1.37+ refuses to start when a debugging switch is on the
# command line:
#
#   Claude: refusing to start — a debugging or network-override switch is
#   present on the command line.
#
# That is a deliberate guard in the app, and it makes this launcher's whole
# approach impossible on such a build. It MUST be detected before we close a
# running Claude: otherwise we shut the app down and then cannot start it
# again, leaving the user with no Claude at all.
#
# The probe is safe precisely because the guard exists — the process prints the
# refusal and exits immediately without touching a running instance. On a build
# without the guard the process keeps running (and is the launch we wanted), so
# "still alive after a few seconds" is read as "allowed".
function Test-DebugSwitchRefused {
    param([string]$Exe, [int]$P)

    $errFile = Join-Path $env:TEMP ("claude-rtl-probe-err-" + [guid]::NewGuid().ToString('N') + ".txt")
    $outFile = Join-Path $env:TEMP ("claude-rtl-probe-out-" + [guid]::NewGuid().ToString('N') + ".txt")
    try {
        $proc = Start-Process -FilePath $Exe -ArgumentList "--remote-debugging-port=$P" `
            -PassThru -RedirectStandardError $errFile -RedirectStandardOutput $outFile
        if (-not $proc.WaitForExit(8000)) { return $false }  # still running => not refused
        if ($proc.ExitCode -eq 0) { return $false }
        $text = ''
        if (Test-Path $errFile) { $text = [string](Get-Content $errFile -Raw -ErrorAction SilentlyContinue) }
        return ($text -match 'refusing to start')
    } catch {
        return $false
    } finally {
        foreach ($f in @($errFile, $outFile)) {
            if (Test-Path $f) { Remove-Item $f -Force -ErrorAction SilentlyContinue }
        }
    }
}

function Get-PageTargets {
    param([int]$P)
    try {
        $all = Invoke-RestMethod -Uri "http://127.0.0.1:$P/json/list" -TimeoutSec 5
    } catch { return @() }
    # Claude Desktop's content may surface as a 'page' or, depending on the
    # Electron/BrowserView setup, as a 'webview'. Both expose a websocket URL
    # and accept injection; other target types (workers, the browser target)
    # do not carry the DOM we care about.
    return @($all | Where-Object {
        ($_.type -eq 'page' -or $_.type -eq 'webview') -and $_.webSocketDebuggerUrl
    })
}

function Send-CdpCommand {
    param(
        [System.Net.WebSockets.ClientWebSocket]$Socket,
        [int]$Id,
        [string]$Method,
        [hashtable]$Params
    )
    $msg = @{ id = $Id; method = $Method }
    if ($Params) { $msg.params = $Params }

    $json  = $msg | ConvertTo-Json -Depth 6 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $seg   = New-Object System.ArraySegment[byte] -ArgumentList @(,$bytes)
    $ct    = [System.Threading.CancellationToken]::None

    $Socket.SendAsync($seg, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $ct).
        GetAwaiter().GetResult()

    # Drain until the reply with our id arrives; events may interleave.
    $buffer = New-Object byte[] 65536
    $deadline = (Get-Date).AddSeconds(15)
    while ((Get-Date) -lt $deadline) {
        $sb = New-Object System.Text.StringBuilder
        do {
            $seg2 = New-Object System.ArraySegment[byte] -ArgumentList @(,$buffer)
            $res  = $Socket.ReceiveAsync($seg2, $ct).GetAwaiter().GetResult()
            [void]$sb.Append([System.Text.Encoding]::UTF8.GetString($buffer, 0, $res.Count))
        } while (-not $res.EndOfMessage)

        $text = $sb.ToString()
        if ($text -match '"id"\s*:\s*' + $Id + '\b') {
            return ($text | ConvertFrom-Json)
        }
    }
    throw "Timed out waiting for CDP reply to $Method"
}

function Inject-Target {
    param([string]$WsUrl, [string]$Source)

    $socket = New-Object System.Net.WebSockets.ClientWebSocket
    try {
        $ct = [System.Threading.CancellationToken]::None
        $socket.ConnectAsync([Uri]$WsUrl, $ct).GetAwaiter().GetResult()

        [void](Send-CdpCommand -Socket $socket -Id 1 -Method 'Page.enable')

        # Survives in-app navigation and reloads.
        [void](Send-CdpCommand -Socket $socket -Id 2 `
            -Method 'Page.addScriptToEvaluateOnNewDocument' `
            -Params @{ source = $Source })

        # And apply to the page that is already showing.
        $r = Send-CdpCommand -Socket $socket -Id 3 -Method 'Runtime.evaluate' `
            -Params @{ expression = $Source; awaitPromise = $false }

        if ($r.PSObject.Properties.Name -contains 'result' -and
            $r.result.PSObject.Properties.Name -contains 'exceptionDetails') {
            Write-Warning ("Payload threw: " + $r.result.exceptionDetails.text)
            return $false
        }
        return $true
    } finally {
        try {
            $socket.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure,
                '', [System.Threading.CancellationToken]::None).GetAwaiter().GetResult()
        } catch { }
        $socket.Dispose()
    }
}

# ------------------------------------------------------------------ actions

function New-DesktopShortcut {
    $desktop  = [Environment]::GetFolderPath('Desktop')
    $lnk      = Join-Path $desktop 'Claude (RTL).lnk'
    $shell    = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($lnk)
    $shortcut.TargetPath  = (Get-Command powershell.exe).Source
    $shortcut.Arguments   = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$PSCommandPath`" -Watch"
    $shortcut.WorkingDirectory = (Split-Path -Parent $PSCommandPath)
    $shortcut.Description = 'Claude Desktop with Hebrew/Arabic RTL support'
    $claude = Find-ClaudeExe
    if ($claude) { $shortcut.IconLocation = $claude }
    $shortcut.Save()
    Write-Host "Shortcut created: $lnk" -ForegroundColor Green
}

function Invoke-Diagnose {
    Write-Host "`n=== claude-rtl diagnostics ===" -ForegroundColor Cyan

    $exe = Find-ClaudeExe
    if ($exe) { Write-Host "Claude executable : $exe" -ForegroundColor Green }
    else       { Write-Host "Claude executable : NOT FOUND" -ForegroundColor Red }

    $isMsix = $exe -and ($exe -like '*\WindowsApps\Claude_*')
    Write-Host ("Install type      : " + $(if ($isMsix) { 'Microsoft Store / MSIX' } elseif ($exe) { 'legacy (Squirrel/NSIS)' } else { 'unknown' }))
    if ($isMsix) {
        Write-Host "  A Store build is read-only, so the asar patch (method 2) cannot apply." -ForegroundColor DarkGray
        Write-Host "  The debug port, if allowed at all, only binds on a cold start." -ForegroundColor DarkGray
    }

    $running = Get-ClaudeDesktopProcess
    Write-Host "Running (Desktop) : $($running.Count)"

    $ver = Test-DebugPort -P $Port
    # Resolve the guard first: when the build refuses debugging switches, telling
    # the user to close Claude and try again would be sending them nowhere.
    $refused = $false
    if ($exe -and -not $ver) { $refused = Test-DebugSwitchRefused -Exe $exe -P $Port }

    if ($ver) {
        Write-Host "Debug port $Port  : OPEN ($($ver.Browser))" -ForegroundColor Green
        $targets = Get-PageTargets -P $Port
        Write-Host "Page targets      : $($targets.Count)"
        foreach ($t in $targets) { Write-Host "  - $($t.title)" }
    } else {
        Write-Host "Debug port $Port  : closed" -ForegroundColor Yellow
        if ($running.Count -gt 0 -and -not $refused) {
            Write-Host "  Claude is running but was not started with debugging enabled." -ForegroundColor Yellow
            Write-Host "  Close Claude completely (check the tray) and run this script again." -ForegroundColor Yellow
        }
    }

    if ($exe -and -not $ver) {
        if ($refused) {
            Write-Host "Debug switch      : REFUSED by this build" -ForegroundColor Red
            Write-Host "  Claude exits with 'refusing to start - a debugging or network-override" -ForegroundColor DarkGray
            Write-Host "  switch is present on the command line'. The launcher cannot work here;" -ForegroundColor DarkGray
            Write-Host "  use the browser userscript on claude.ai (see README)." -ForegroundColor DarkGray
        } else {
            Write-Host "Debug switch      : accepted" -ForegroundColor Green
        }
    }

    try {
        $p = Get-Payload
        Write-Host "Payload           : OK ($($p.Length) chars)" -ForegroundColor Green
    } catch {
        Write-Host "Payload           : $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# --------------------------------------------------------------------- main

if ($CreateShortcut) { New-DesktopShortcut; return }
if ($Diagnose)       { Invoke-Diagnose;     return }

$payload = Get-Payload

if (-not (Test-DebugPort -P $Port)) {
    $exeCheck = Find-ClaudeExe
    if (-not $exeCheck) { throw "Claude Desktop not found. Run with -Diagnose for details." }

    # Check this BEFORE closing anything. On a build that refuses debugging
    # switches there is no launcher route at all, and closing Claude here would
    # leave the user unable to reopen it through this script.
    if (Test-DebugSwitchRefused -Exe $exeCheck -P $Port) {
        Write-Host ""
        Write-Host "This build of Claude Desktop refuses to start with a debugging switch." -ForegroundColor Red
        Write-Host "  Claude: refusing to start - a debugging or network-override switch" -ForegroundColor DarkGray
        Write-Host "  is present on the command line." -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "That guard makes this launcher (method 1) impossible on this build, and" -ForegroundColor Yellow
        Write-Host "the asar patch (method 2) is blocked on Store/MSIX installs as well." -ForegroundColor Yellow
        Write-Host "Working around a deliberate protection is out of scope for this project." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Use the browser userscript on claude.ai instead - see README." -ForegroundColor Cyan
        Write-Host "Claude Desktop was NOT touched." -ForegroundColor Green
        Write-Host ""
        return
    }

    $running = Get-ClaudeDesktopProcess
    if ($running.Count -gt 0) {
        Write-Host "Claude Desktop is already running without the debugging port." -ForegroundColor Yellow
        Write-Host "It has to be closed and reopened once so the port can be enabled." -ForegroundColor Yellow
        $answer = Read-Host "Restart Claude now? Unsent drafts may be lost. [y/N]"
        if ($answer -notmatch '^[yY]') {
            Write-Host "Aborted. Close Claude yourself, then run this script again."
            return
        }
        # Only the Desktop app — Get-ClaudeDesktopProcess never returns the
        # Claude Code CLI, so a running CLI session is left alone.
        $running | Stop-Process -Force
        Start-Sleep -Seconds 3
    }

    $exe = Find-ClaudeExe
    if (-not $exe) { throw "Claude Desktop not found. Run with -Diagnose for details." }

    Write-Host "Starting Claude with RTL injection..." -ForegroundColor Cyan
    Start-Process -FilePath $exe -ArgumentList "--remote-debugging-port=$Port"

    $deadline = (Get-Date).AddSeconds(45)
    while (-not (Test-DebugPort -P $Port)) {
        if ((Get-Date) -gt $deadline) {
            # We may have closed Claude to get here. Never leave the user
            # without their app because the injection route failed.
            Write-Host "Claude did not open the debugging port within 45s." -ForegroundColor Red
            if ((Get-ClaudeDesktopProcess).Count -eq 0) {
                Write-Host "Reopening Claude normally, without RTL..." -ForegroundColor Yellow
                Start-Process -FilePath $exe
            }
            throw ("Claude did not open the debugging port. Run with -Diagnose, " +
                   "and see the README fallback section (browser userscript).")
        }
        Start-Sleep -Milliseconds 500
    }
}

$injected = @{}

function Invoke-InjectionPass {
    $targets = Get-PageTargets -P $Port
    foreach ($t in $targets) {
        if ($injected.ContainsKey($t.id)) { continue }
        try {
            if (Inject-Target -WsUrl $t.webSocketDebuggerUrl -Source $payload) {
                $injected[$t.id] = $true
                $label = $t.id
            if ($t.PSObject.Properties.Name -contains 'title' -and $t.title) {
                $label = $t.title
            }
                Write-Host "RTL injected -> $label" -ForegroundColor Green
            }
        } catch {
            Write-Warning "Injection failed for $($t.id): $($_.Exception.Message)"
        }
    }
    return $targets.Count
}

# The renderer may not have a page target for a second or two after launch.
$deadline = (Get-Date).AddSeconds(30)
while ($injected.Count -eq 0 -and (Get-Date) -lt $deadline) {
    [void](Invoke-InjectionPass)
    if ($injected.Count -eq 0) { Start-Sleep -Milliseconds 750 }
}

if ($injected.Count -eq 0) {
    Write-Warning "No page target accepted the payload. Run with -Diagnose."
    return
}

Write-Host "`nRTL is active. Ctrl+Alt+R toggles it inside Claude." -ForegroundColor Green

if ($Watch) {
    Write-Host "Watching for new windows. Ctrl+C to stop (Claude keeps running).`n"
    while ($true) {
        Start-Sleep -Seconds 3
        if (-not (Test-DebugPort -P $Port)) {
            Write-Host "Claude closed. Exiting." -ForegroundColor Cyan
            break
        }
        [void](Invoke-InjectionPass)
    }
}
