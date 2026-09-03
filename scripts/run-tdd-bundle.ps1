[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Repo,

    [Parameter(Mandatory = $true)]
    [string]$BundleRoot,

    [string]$ManifestPath = ""
)

$ErrorActionPreference = "Stop"

$utf8 = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
& chcp.com 65001 > $null

$script:LogPath = $null

function Write-BundleLog {
    param([string]$Message = "")

    Write-Host $Message

    if ($script:LogPath) {
        Add-Content -LiteralPath $script:LogPath -Value $Message -Encoding UTF8
    }
}

function Stop-Bundle {
    param([string]$Message)

    throw [System.InvalidOperationException]::new($Message)
}

function Invoke-LoggedNative {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Program,

        [string[]]$Arguments = @(),

        [string]$Label = ""
    )

    if ($Label) {
        Write-BundleLog ""
        Write-BundleLog "=== $Label ==="
    }

    $command = Get-Command $Program -ErrorAction Stop
    $captured = [System.Collections.Generic.List[string]]::new()

    $previousErrorActionPreference = $ErrorActionPreference

    try {
        $ErrorActionPreference = "Continue"

        & $command.Source @Arguments 2>&1 | ForEach-Object {
            if ($_ -is [System.Management.Automation.ErrorRecord]) {
                $line = [string]$_.Exception.Message
            } else {
                $line = [string]$_
            }

            if ($line -ne 'System.Management.Automation.RemoteException') {
                $captured.Add($line)
                Write-BundleLog $line
            }
        }

        $code = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    return [pscustomobject]@{
        ExitCode = $code
        Output = ($captured -join "`n")
    }
}

function Assert-NativeSuccess {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Result,

        [Parameter(Mandatory = $true)]
        [string]$Context
    )

    if ($Result.ExitCode -ne 0) {
        Stop-Bundle "$Context failed with exit code $($Result.ExitCode)."
    }
}

function Resolve-BundlePath {
    param([string]$RelativePath)

    if ([string]::IsNullOrWhiteSpace($RelativePath)) {
        Stop-Bundle "Manifest contains an empty bundle path."
    }

    return [System.IO.Path]::GetFullPath(
        (Join-Path $BundleRoot $RelativePath)
    )
}

function Invoke-Patch {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RelativePath,

        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    $patch = Resolve-BundlePath $RelativePath

    if (-not (Test-Path -LiteralPath $patch -PathType Leaf)) {
        Stop-Bundle "Patch not found: $patch"
    }

    $check = Invoke-LoggedNative `
        -Program "git" `
        -Arguments @("apply", "--check", $patch) `
        -Label "$Label - patch check"

    Assert-NativeSuccess $check "$Label patch check"

    $apply = Invoke-LoggedNative `
        -Program "git" `
        -Arguments @("apply", $patch) `
        -Label "$Label - patch apply"

    Assert-NativeSuccess $apply "$Label patch apply"
}

function Invoke-ManifestCommand {
    param(
        [Parameter(Mandatory = $true)]
        $Command,

        [Parameter(Mandatory = $true)]
        [string]$Label,

        [switch]$AllowFailure
    )

    $arguments = @()

    if ($null -ne $Command.args) {
        $arguments = @(
            $Command.args | ForEach-Object {
                ([string]$_).
                    Replace('{repo}', $script:ResolvedRepo).
                    Replace('{bundle}', $script:ResolvedBundleRoot).
                    Replace('{manifest}', $script:ResolvedManifestPath)
            }
        )
    }

    $result = Invoke-LoggedNative `
        -Program ([string]$Command.program) `
        -Arguments $arguments `
        -Label $Label

    if (-not $AllowFailure -and $result.ExitCode -ne 0) {
        Stop-Bundle "$Label failed with exit code $($result.ExitCode)."
    }

    return $result
}

function Assert-ExpectedRed {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Result,

        [Parameter(Mandatory = $true)]
        $Cycle
    )

    if ($Result.ExitCode -eq 0) {
        Stop-Bundle "TDD $($Cycle.id) RED unexpectedly passed. GREEN patch was not applied."
    }

    foreach ($expected in @($Cycle.redExpected)) {
        $needle = [string]$expected

        if (-not $Result.Output.Contains($needle)) {
            Stop-Bundle (
                "TDD $($Cycle.id) RED failed, but the expected marker was not found: " +
                "'$needle'. GREEN patch was not applied."
            )
        }
    }

    Write-BundleLog "TDD $($Cycle.id) RED confirmed for the expected reason."
}

try {
    $Repo = [System.IO.Path]::GetFullPath($Repo)
    $BundleRoot = [System.IO.Path]::GetFullPath($BundleRoot)

    $script:ResolvedRepo = $Repo
    $script:ResolvedBundleRoot = $BundleRoot

    if (-not (Test-Path -LiteralPath $Repo -PathType Container)) {
        Stop-Bundle "Repository directory does not exist: $Repo"
    }

    if (-not (Test-Path -LiteralPath (Join-Path $Repo ".git") -PathType Container)) {
        Stop-Bundle "Not a Git repository: $Repo"
    }

    if (-not (Test-Path -LiteralPath $BundleRoot -PathType Container)) {
        Stop-Bundle "Bundle directory does not exist: $BundleRoot"
    }

    if ([string]::IsNullOrWhiteSpace($ManifestPath)) {
        $ManifestPath = Join-Path $BundleRoot "manifest.json"
    } else {
        $ManifestPath = [System.IO.Path]::GetFullPath($ManifestPath)
    }

    if (-not (Test-Path -LiteralPath $ManifestPath -PathType Leaf)) {
        Stop-Bundle "Manifest not found: $ManifestPath"
    }

    $script:ResolvedManifestPath = $ManifestPath

    Set-Location -LiteralPath $Repo

    $manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json

    Write-BundleLog "Workspace App fail-fast bundle runner"
    Write-BundleLog "Bundle: $($manifest.bundleId)"
    Write-BundleLog "Repo: $Repo"
    Write-BundleLog "Manifest: $ManifestPath"

    if ([int]$manifest.schemaVersion -ne 1) {
        Stop-Bundle "Unsupported manifest schema version: $($manifest.schemaVersion)"
    }

    $branchResult = Invoke-LoggedNative `
        -Program "git" `
        -Arguments @("rev-parse", "--abbrev-ref", "HEAD") `
        -Label "Precondition - branch"

    Assert-NativeSuccess $branchResult "Branch lookup"
    $branch = $branchResult.Output.Trim()

    if ($manifest.expectedBranch -and $branch -ne [string]$manifest.expectedBranch) {
        Stop-Bundle "Expected branch '$($manifest.expectedBranch)', found '$branch'."
    }

    $headResult = Invoke-LoggedNative `
        -Program "git" `
        -Arguments @("rev-parse", "HEAD") `
        -Label "Precondition - HEAD"

    Assert-NativeSuccess $headResult "HEAD lookup"
    $head = $headResult.Output.Trim()

    if ($manifest.expectedHeadPrefix) {
        $prefix = [string]$manifest.expectedHeadPrefix

        if (-not $head.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            Stop-Bundle "Expected HEAD beginning with '$prefix', found '$head'."
        }
    }

    foreach ($requiredPath in @($manifest.requiredPaths)) {
        $candidate = Join-Path $Repo ([string]$requiredPath)

        if (-not (Test-Path -LiteralPath $candidate)) {
            Stop-Bundle "Required repository path is missing: $requiredPath"
        }
    }

    $statusResult = Invoke-LoggedNative `
        -Program "git" `
        -Arguments @("status", "--porcelain") `
        -Label "Precondition - working tree"

    Assert-NativeSuccess $statusResult "Git status"

    $actualStatus = @(
        $statusResult.Output -split "`r?`n" |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )
    $expectedStatus = @($manifest.expectedStatus | ForEach-Object { [string]$_ })

    if ($manifest.requireClean) {
        if ($actualStatus.Count -ne 0) {
            Stop-Bundle "Working tree is not clean. No patches were applied."
        }
    } elseif ($expectedStatus.Count -gt 0) {
        $actualSorted = @($actualStatus | Sort-Object)
        $expectedSorted = @($expectedStatus | Sort-Object)

        if (($actualSorted -join "`n") -ne ($expectedSorted -join "`n")) {
            Stop-Bundle (
                "Working tree does not match the expected resume state.`n" +
                "Expected:`n$($expectedSorted -join "`n")`n" +
                "Actual:`n$($actualSorted -join "`n")"
            )
        }
    }

    foreach ($entry in @($manifest.expectedFileSha256)) {
        $relativePath = [string]$entry.path
        $expectedSha = ([string]$entry.sha256).ToLowerInvariant()
        $candidate = Join-Path $Repo $relativePath

        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            Stop-Bundle "Expected checksum file is missing: $relativePath"
        }

        $actualSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidate).Hash.ToLowerInvariant()

        if ($actualSha -ne $expectedSha) {
            Stop-Bundle (
                "Checksum mismatch for $relativePath. " +
                "Expected $expectedSha, found $actualSha."
            )
        }
    }

    foreach ($entry in @($manifest.expectedNormalizedFileSha256)) {
        $relativePath = [string]$entry.path
        $expectedSha = ([string]$entry.sha256).ToLowerInvariant()
        $candidate = Join-Path $Repo $relativePath

        if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            Stop-Bundle "Expected normalized-checksum file is missing: $relativePath"
        }

        $text = [System.IO.File]::ReadAllText($candidate)
        $normalized = $text.Replace("`r`n", "`n").Replace("`r", "`n")
        $bytes = [System.Text.UTF8Encoding]::new($false).GetBytes($normalized)
        $sha = [System.Security.Cryptography.SHA256]::Create()

        try {
            $actualSha = ([System.BitConverter]::ToString($sha.ComputeHash($bytes))).Replace("-", "").ToLowerInvariant()
        }
        finally {
            $sha.Dispose()
        }

        if ($actualSha -ne $expectedSha) {
            Stop-Bundle (
                "Normalized checksum mismatch for $relativePath. " +
                "Expected $expectedSha, found $actualSha."
            )
        }
    }

    $logDirectory = Join-Path $Repo ".tdd-logs"
    New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null

    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $script:LogPath = Join-Path $logDirectory "bundle-$stamp.log"

    Write-BundleLog ""
    Write-BundleLog "Preconditions passed."
    Write-BundleLog "Branch: $branch"
    Write-BundleLog "HEAD: $head"
    Write-BundleLog "Log: $script:LogPath"

    foreach ($step in @($manifest.maintenanceSteps)) {
        Write-BundleLog ""
        Write-BundleLog "##### MAINTENANCE $($step.id) #####"

        if ($null -ne $step.action) {
            [void](Invoke-ManifestCommand `
                -Command $step.action `
                -Label "Maintenance $($step.id) setup")
        } else {
            Invoke-Patch `
                -RelativePath ([string]$step.patch) `
                -Label "Maintenance $($step.id)"
        }

        foreach ($command in @($step.commands)) {
            [void](Invoke-ManifestCommand `
                -Command $command `
                -Label "Maintenance $($step.id) - $($command.label)")
        }
    }

    foreach ($cycle in @($manifest.cycles)) {
        Write-BundleLog ""
        Write-BundleLog "##### TDD $($cycle.id) RED #####"

        if ([bool]$cycle.redAlreadyApplied) {
            Write-BundleLog "TDD $($cycle.id) RED setup was already applied by the stopped run."
        } elseif ($null -ne $cycle.redAction) {
            [void](Invoke-ManifestCommand `
                -Command $cycle.redAction `
                -Label "TDD $($cycle.id) RED setup")
        } else {
            Invoke-Patch `
                -RelativePath ([string]$cycle.redPatch) `
                -Label "TDD $($cycle.id) RED"
        }

        $redResult = Invoke-ManifestCommand `
            -Command $cycle.redCommand `
            -Label "TDD $($cycle.id) RED test" `
            -AllowFailure

        Assert-ExpectedRed -Result $redResult -Cycle $cycle

        Write-BundleLog ""
        Write-BundleLog "##### TDD $($cycle.id) GREEN #####"

        if ($null -ne $cycle.greenAction) {
            [void](Invoke-ManifestCommand `
                -Command $cycle.greenAction `
                -Label "TDD $($cycle.id) GREEN setup")
        } else {
            Invoke-Patch `
                -RelativePath ([string]$cycle.greenPatch) `
                -Label "TDD $($cycle.id) GREEN"
        }

        foreach ($command in @($cycle.greenCommands)) {
            [void](Invoke-ManifestCommand `
                -Command $command `
                -Label "TDD $($cycle.id) GREEN - $($command.label)")
        }

        $diffCheck = Invoke-LoggedNative `
            -Program "git" `
            -Arguments @("diff", "--check") `
            -Label "TDD $($cycle.id) - git diff --check"

        Assert-NativeSuccess $diffCheck "TDD $($cycle.id) git diff --check"
    }


    foreach ($step in @($manifest.postSteps)) {
        Write-BundleLog ""
        Write-BundleLog "##### POST $($step.id) #####"

        if ($null -ne $step.action) {
            [void](Invoke-ManifestCommand `
                -Command $step.action `
                -Label "Post $($step.id) setup")
        } else {
            Invoke-Patch `
                -RelativePath ([string]$step.patch) `
                -Label "Post $($step.id)"
        }

        foreach ($command in @($step.commands)) {
            [void](Invoke-ManifestCommand `
                -Command $command `
                -Label "Post $($step.id) - $($command.label)")
        }
    }

    foreach ($command in @($manifest.finalCommands)) {
        [void](Invoke-ManifestCommand `
            -Command $command `
            -Label "Final - $($command.label)")
    }

    if ($manifest.commit -and [bool]$manifest.commit.enabled) {
        $diffCheck = Invoke-LoggedNative `
            -Program "git" `
            -Arguments @("diff", "--check") `
            -Label "Pre-commit - git diff --check"

        Assert-NativeSuccess $diffCheck "Pre-commit git diff --check"

        $add = Invoke-LoggedNative `
            -Program "git" `
            -Arguments @("add", "-A") `
            -Label "Commit - stage changes"

        Assert-NativeSuccess $add "git add"

        $cachedCheck = Invoke-LoggedNative `
            -Program "git" `
            -Arguments @("diff", "--cached", "--check") `
            -Label "Commit - staged diff check"

        Assert-NativeSuccess $cachedCheck "Staged diff check"

        $commit = Invoke-LoggedNative `
            -Program "git" `
            -Arguments @("commit", "-m", [string]$manifest.commit.message) `
            -Label "Commit"

        Assert-NativeSuccess $commit "git commit"

        $finalStatus = Invoke-LoggedNative `
            -Program "git" `
            -Arguments @("status", "--porcelain") `
            -Label "Post-commit status"

        Assert-NativeSuccess $finalStatus "Post-commit git status"

        if (-not [string]::IsNullOrWhiteSpace($finalStatus.Output)) {
            Stop-Bundle "Bundle committed, but the working tree is not clean."
        }
    }

    Write-BundleLog ""
    Write-BundleLog "COMPLETE: $($manifest.bundleId)"
    Write-BundleLog "Log: $script:LogPath"
}
catch {
    Write-BundleLog ""
    Write-BundleLog "STOPPED"
    Write-BundleLog $_.Exception.Message

    if ($script:LogPath) {
        Write-BundleLog "Log: $script:LogPath"
    }

    Write-BundleLog "No reset or cleanup was performed. The terminal remains open."
    return
}
