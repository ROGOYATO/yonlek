[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Repo,

    [Parameter(Mandatory = $true)]
    [string]$BundleRoot,

    [string]$ManifestPath = ""
)

$ErrorActionPreference = "Stop"
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

    & $command.Source @Arguments 2>&1 | ForEach-Object {
        $line = [string]$_
        $captured.Add($line)
        Write-BundleLog $line
    }

    $code = $LASTEXITCODE

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
        $arguments = @($Command.args | ForEach-Object { [string]$_ })
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

    if ($manifest.requireClean) {
        $statusResult = Invoke-LoggedNative `
            -Program "git" `
            -Arguments @("status", "--porcelain") `
            -Label "Precondition - clean working tree"

        Assert-NativeSuccess $statusResult "Git status"

        if (-not [string]::IsNullOrWhiteSpace($statusResult.Output)) {
            Stop-Bundle "Working tree is not clean. No patches were applied."
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

        Invoke-Patch `
            -RelativePath ([string]$step.patch) `
            -Label "Maintenance $($step.id)"

        foreach ($command in @($step.commands)) {
            [void](Invoke-ManifestCommand `
                -Command $command `
                -Label "Maintenance $($step.id) - $($command.label)")
        }
    }

    foreach ($cycle in @($manifest.cycles)) {
        Write-BundleLog ""
        Write-BundleLog "##### TDD $($cycle.id) RED #####"

        Invoke-Patch `
            -RelativePath ([string]$cycle.redPatch) `
            -Label "TDD $($cycle.id) RED"

        $redResult = Invoke-ManifestCommand `
            -Command $cycle.redCommand `
            -Label "TDD $($cycle.id) RED test" `
            -AllowFailure

        Assert-ExpectedRed -Result $redResult -Cycle $cycle

        Write-BundleLog ""
        Write-BundleLog "##### TDD $($cycle.id) GREEN #####"

        Invoke-Patch `
            -RelativePath ([string]$cycle.greenPatch) `
            -Label "TDD $($cycle.id) GREEN"

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
