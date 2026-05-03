import { writeFileSync } from 'fs';

const posts = [];

function make(slug, title, date, tags, body) {
  // get first non-blank paragraph as description
  let desc = '';
  const lines = body.trim().split('\n');
  for (const line of lines) {
    const clean = line.replace(/^[#*\s>\[\]`!-]+/, '').trim();
    if (clean.length > 40 && clean.length < 200 && !clean.startsWith('```') && !clean.startsWith('|')) {
      desc = clean;
      break;
    }
  }
  if (!desc) desc = `A post about ${title.toLowerCase()}.`;

  const fm = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${date}"
description: "${desc.replace(/"/g, '\\"')}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
---

${body.trim()}
`;
  writeFileSync(`src/content/${slug}.mdx`, fm);
  console.log(`Created: ${slug}.mdx`);
  posts.push({ slug, title, date, description: desc, tags });
}

// ============ POST 5: WinGet Without WinGet ============
make(
  'winget-without-winget-building-a-cross-platform-package-manifest-fetcher',
  'WinGet Without WinGet: Building a Cross-Platform Package Manifest Fetcher',
  '2025-07-20',
  ['powershell', 'winget', 'cross-platform', 'github-api', 'devops'],
  `So here's the thing, I love WinGet. It's transformed how I manage software on Windows. But what happens when you need WinGet package information on a Mac? Or Linux? Or even on a Windows box where WinGet isn't installed yet?

That's the itch I needed to scratch. And thus, [WinGet Manifest Fetcher](https://github.com/jorgeasaurus/WinGet-Manifest-Fetcher) was born.

## The Problem

WinGet is awesome, but it's Windows-only. The package manifests, however, live in a public GitHub repository. Why should we need the WinGet client just to query package information? Spoiler: we don't.

I wanted to:

- Query WinGet packages from my Mac
- Download installers with hash verification
- Search for packages by publisher
- Do all this without needing WinGet installed

## The Solution

Enter PowerShell (yes, on Mac!) and some GitHub API magic. The module I built hits the [microsoft/winget-pkgs](https://github.com/microsoft/winget-pkgs) repository directly, parsing YAML manifests and serving up the data you need.

### Getting Started

First, grab it from the PowerShell Gallery:

\`\`\`powershell
Install-Module -Name WinGetManifestFetcher -Scope CurrentUser
Import-Module WinGetManifestFetcher
\`\`\`

### What does it do?

Want to know about a package? Easy:

\`\`\`powershell
Get-LatestWingetVersion -App "Microsoft.PowerToys"
\`\`\`

This gives you everything - version info, download URLs, hashes, installer types, the works.

Need to actually download an installer? Got you covered:

\`\`\`powershell
Save-WingetInstaller -App "7zip.7zip" -Path "./Downloads"
\`\`\`

It'll download the installer AND verify the SHA256 hash. Because security matters, even when you're being lazy.

### Publisher Search? Why not?

Ever wondered what packages Microsoft publishes? Or maybe you're looking for all JetBrains tools?

\`\`\`powershell
Get-WingetPackagesByPublisher -Publisher "JetBrains" -MaxResults 10
\`\`\`

Want version info too? Just add \`-IncludeVersions\`. Fair warning: this makes extra API calls, so maybe don't do this for publishers with hundreds of packages unless you enjoy watching progress bars.

## The Technical Bits

### Cross-Platform All The Things

The module works on Windows, macOS, and Linux because PowerShell 7+ is everywhere now. The cache directory even respects platform conventions:

- Windows: \`%LOCALAPPDATA%\\WinGetManifestFetcher\\Cache\`
- macOS: \`~/Library/Caches/WinGetManifestFetcher\`
- Linux: \`~/.cache/WinGetManifestFetcher\`

### GitHub API Rate Limits Are Real

Without authentication, GitHub gives you 60 API calls per hour. That's... not a lot. So I added caching (60-minute default) and support for GitHub tokens:

\`\`\`powershell
$env:GITHUB_TOKEN = "your_github_personal_access_token"
\`\`\`

With a token, you get 5,000 requests per hour. Much better.

### PSStucco Structure Because Standards

I used PSStucco for the module structure because I'm not a barbarian. Public functions in \`src/Public/\`, private functions in \`src/Private/\`, tests in \`Tests/\`. You know, like civilized PowerShell modules do.

## Lessons Learned

### 1. YAML Parsing in PowerShell Is... Special

The \`powershell-yaml\` module is great, but WinGet manifests can be creative with their YAML. I had to handle edge cases like empty version directories, malformed manifests, and the occasional "this isn't even valid YAML but somehow it's in the repo."

### 2. GitHub's Directory API Has Opinions

When you query a directory in the GitHub API, sometimes you get an array, sometimes you get an object with an \`entries\` property. Why? Who knows. Just handle both and move on with your life.

### 3. Testing Private Functions Is Annoying

PSStucco's module structure is great until you need to test private functions. \`InModuleScope\` is your friend, but it makes test code verbose. I ended up creating a \`TestHelper.ps1\` that builds the module dynamically for testing.

### 4. Cross-Platform Path Handling

Windows uses backslashes. Everyone else uses forward slashes. \`Join-Path\` handles this, but string concatenation doesn't. Guess how I learned this lesson?

## What's Next?

The module is now on the PowerShell Gallery, so installation is dead simple. I've got some ideas for v2:

- Version history retrieval (not just latest)
- Manifest validation
- Maybe even dependency resolution?

But for now, it scratches my itch. I can query WinGet packages from my Mac, download installers with confidence, and search for packages without firing up a Windows VM.

## Try It Out

The module is open source and available now:

\`\`\`powershell
Install-Module -Name WinGetManifestFetcher -Scope CurrentUser
\`\`\`

Check out the [GitHub repo](https://github.com/jorgeasaurus/WinGet-Manifest-Fetcher) for more examples and documentation. PRs welcome - especially if you find edge cases I missed (and trust me, there are probably dozens).

Because sometimes you need WinGet data without WinGet. And that's okay.

---

_PS: Yes, I used AI to help with some of the documentation. No shame in the AI assistance game. But the bugs? Those are 100% artisanal, hand-crafted by yours truly._`
);

// ============ POST 6: Graph Batch Requests ============
make(
  'supercharge-microsoft-graph-api-data-retrieval-with-powershell-batch-requests',
  'Supercharge Microsoft Graph API Data Retrieval with PowerShell Batch Requests',
  '2025-07-15',
  ['powershell', 'microsoft-graph', 'performance', 'api', 'automation'],
  `## The Challenge That Started It

Picture this: You're tasked with exporting all sign-in logs from your organization's Microsoft 365 tenant for a security audit. You fire up PowerShell, run \`Get-MgBetaAuditLogSignIn -All\`, and then... you wait. And wait. And wait some more.

What should be a simple data export turns into an hours-long ordeal. Sound familiar?

This is the story of how I transformed a painfully slow process into a lightning-fast data retrieval system, reducing wait times by up to 88% using Microsoft Graph API's batch processing capabilities.

## The Numbers Don't Lie

Before diving into the solution, let me share some real-world performance metrics from my testing with actual production data:

| Endpoint | Objects | Traditional Method | Optimized Batch Method | Improvement |
|----------|---------|-------------------|----------------------|-------------|
| Devices | 68,677 | 4m 7s | 1m 34s (Memory Managed) | **62% faster** |
| Groups | 13,585 | 43.7s | 18.1s (Memory Managed) | **59% faster** |
| Users | 24,284 | 3m 24s | 2m 2s (Sequential) | **40% faster** |
| Applications | 347 | 1.4s | 0.8s (Parallel) | **45% faster** |

These aren't theoretical improvements – they're actual results from production environments with real enterprise datasets.

## Understanding the Root Problem

Microsoft Graph API uses pagination to prevent overwhelming clients with massive datasets. When you request data, you typically get:

- A page of results (default: 100 items, max: 999)
- A "nextLink" URL pointing to the next page
- Repeat until all data is retrieved

The traditional approach looks like this:

\`\`\`powershell
# The slow way - sequential pagination
$allItems = @()
$uri = "https://graph.microsoft.com/beta/users"

do {
    $response = Invoke-MgGraphRequest -Uri $uri
    $allItems += $response.value
    $uri = $response.'@odata.nextLink'
} while ($uri)
\`\`\`

For 10,000 users across 100 pages, that's 100 sequential HTTP requests. Each with its own:

- Network latency
- API processing time
- Authentication overhead

There had to be a better way.

## The Breakthrough: Batch Requests

[Microsoft Graph supports batch requests](https://learn.microsoft.com/en-us/graph/json-batching) – the ability to bundle multiple API calls into a single HTTP request. Instead of 100 sequential calls, we can make 5 batch requests, each containing 20 individual requests.

Here's the game-changer: those 5 batch requests can run in parallel.

## Core Capabilities

- **Multi-cloud environment detection** - Automatically supports Global, USGov, China, and Germany clouds
- **Intelligent nextLink handling** - Uses complete URLs instead of token extraction for reliability
- **Parallel and sequential processing** - Configurable based on dataset size and performance needs
- **Memory monitoring and warnings** - Built-in thresholds to prevent memory exhaustion
- **Comprehensive error handling** - Robust HTTP status monitoring and debugging support

## Usage Examples

### Basic Usage

\`\`\`powershell
# Simple batch retrieval
$users = Invoke-mgBatchRequest -Endpoint "users"

# With filtering
$windowsDevices = Invoke-mgBatchRequest -Endpoint "deviceManagement/managedDevices" -Filter "operatingSystem eq 'Windows'"

# With expanded properties
$mobileAppsWithAssignments = Invoke-mgBatchRequest -Endpoint "deviceAppManagement/mobileApps" -ExpandProperty "assignments"
\`\`\`

### Optimized for Large Datasets

\`\`\`powershell
# For enterprise-scale datasets (based on test results)
$allDevices = Invoke-mgBatchRequest -Endpoint "devices" -MemoryThreshold 100
$allUsers = Invoke-mgBatchRequest -Endpoint "users"  # Sequential is optimal for 33K+ users

# Only use parallel processing for specific scenarios
$auditLogs = Invoke-mgBatchRequest -Endpoint "auditLogs/signIns" -UseParallelProcessing -MaxConcurrentJobs 5
\`\`\`

## Real-World Impact

### Performance Gains by Dataset Size:

- **Small datasets** (< 1K objects): 30-50% improvement
- **Medium datasets** (1K-50K objects): 40-60% improvement
- **Large datasets** (50K+ objects): Up to 62% improvement

### Key Learnings:

1. **Sequential batching often outperforms parallel processing** for medium datasets due to reduced overhead
2. **Memory management is crucial** for datasets over 10K objects
3. **Multi-cloud support is essential** for enterprise environments
4. **Proper URL handling** prevents HTTP 400 errors that plagued earlier versions

## Get Started

Ready to transform your Microsoft Graph data retrieval?

1. **Download** the latest version from [GitHub](https://github.com/jorgeasaurus/MgBatchRequest)
2. **Test** with your datasets using \`Test-MgBatchRequest.ps1\`
3. **Optimize** your specific endpoints for maximum performance
4. **Deploy** with confidence using the production-ready commands

The era of waiting hours for Graph API data is over. Welcome to the age of optimized, intelligent data retrieval.`
);

console.log(`Part 2 done. Posts created: ${posts.length}`);
