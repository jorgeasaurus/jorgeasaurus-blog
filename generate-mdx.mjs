import { writeFileSync } from 'fs';

// Helper: clean Ghost-specific cruft from content
function cleanContent(content) {
  return content
    // Remove Ghost signup cards
    .replace(/<div class="kg-card kg-signup-card[\s\S]*?<\/div>/g, '')
    // Remove Ghost bookmark cards - keep just the link
    .replace(/<figure class="kg-card kg-bookmark-card">[\s\S]*?<\/figure>/g, (match) => {
      const urlMatch = match.match(/href="([^"]+)"/);
      const titleMatch = match.match(/kg-bookmark-title">([^<]+)</);
      if (urlMatch) {
        const url = urlMatch[1].replace(/\?ref=jorgeasaur\.us/, '');
        const title = titleMatch ? titleMatch[1] : url;
        return `[${title}](${url})`;
      }
      return '';
    })
    // Remove ?ref=jorgeasaur.us from URLs
    .replace(/\?ref=jorgeasaur\.us/g, '')
    // Remove Ghost-style image captions that are just filenames
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, (match, alt) => {
      // Keep images but remove if alt is just a filename like "image.png"
      if (/^image[-\d]*\.\w+$/i.test(alt) || alt === 'Output' || alt === 'logo.png' || alt === 'dotnetPS.png' || alt === 'IHKLogo.png' || alt === 'IntuneCloud.png') {
        return '';
      }
      return match;
    })
    // Remove the "Sign up for" and "Subscribe" Ghost membership prompts in text
    .replace(/\nSign up for > Jorgeasaurus[\s\S]*?(?=\n##|\n#|$)/g, '')
    // Remove "Email sent! Check your inbox" signup text
    .replace(/Email sent! Check your inbox to complete your signup\./g, '')
    .replace(/No spam\. Unsubscribe anytime\./g, '')
    // Remove the encoded HTML entities
    .replace(/&#x2019;/g, "'")
    .replace(/&#x201C;/g, '"')
    .replace(/&#x201D;/g, '"')
    .replace(/&#xA0;/g, ' ')
    .replace(/&#x2014;/g, '—')
    .replace(/&amp;/g, '&')
    // Remove extra whitespace lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Derive description from content
function getDescription(content, title) {
  // Get first paragraph after frontmatter area
  const lines = content.split('\n');
  for (const line of lines) {
    const clean = line.replace(/^[#*\s>\[\]`!-]+/, '').trim();
    if (clean.length > 40 && clean.length < 200) {
      return clean;
    }
  }
  return `A blog post about ${title.toLowerCase()}.`;
}

function createMdx(slug, title, date, tags, body) {
  const description = getDescription(body, title);
  const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${date}"
description: "${description.replace(/"/g, '\\"')}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
---

${body.trim()}
`;
  writeFileSync(`src/content/${slug}.mdx`, frontmatter);
  console.log(`Created: ${slug}.mdx`);
  return { slug, title, date, description, tags };
}

const posts = [];

// =================== POST DATA ===================

// 1. PowerShell Summit 2026
posts.push(createMdx(
  'powershell-summit-2026-we-are-all-insane-and-that-is-the-opportunity',
  'PowerShell Summit 2026: We Are All Insane, and That Is the Opportunity',
  '2026-04-18',
  ['powershell', 'ai', 'automation', 'career', 'conference'],
  `To quote Jeffrey Snover, "you are all insane."

Not as an insult. As a diagnosis.

In the literal sense, our model of reality is incomplete. We make decisions based on what we think is possible, then new tools arrive and expose how wrong that assumption was.

That was the real theme I took from PowerShell + DevOps Global Summit 2026.

Snover framed it as a shift in the physics of innovation: from the deterministic certainty of Is computing to the probabilistic Ish nature of AI. Once you accept that shift, strategy changes. Planning changes. Leadership changes.

## The Shift We Are Living Through

For years, many of us in the PowerShell space carried quiet assumptions:

- "I can automate ops, but I cannot build real user experiences."
- "I can script APIs, but full application workflows are for other kinds of developers."
- "I can wire tools together, but not create polished systems end to end."

AI is breaking those assumptions in real time.

Now someone without a traditional web background can build a usable GUI. Someone who only wrote admin scripts can scaffold test suites, CI pipelines, modules, and release workflows much faster than before. Someone who avoided complex architecture can now iterate with an AI pair and actually ship.

This is not hype. It is capability expansion.

The important part is not just tool adoption. It is mindset adaptation.

## What Summit Sessions Made Clear

Across the repo materials, the pattern repeats: PowerShell is expanding from "task automation" to "system creation."

- Reusable tooling and module sessions showed that we can productize our automation, not just run it once.
- Security and policy sessions reinforced that modern automation must be governed by design.
- Infrastructure and compliance content demonstrated repeatable delivery patterns, not fragile deployment rituals.
- Observability and resilience talks connected technical quality to long-term team sustainability.
- AI-oriented and style-guide-driven workflows showed how humans and agents can collaborate with stronger feedback loops.
- Hardware, home lab, and integration demos proved the platform can stretch from cloud governance to physical-world control.

Individually, each session was useful. Together, they tell a bigger story: the boundary around what a "PowerShell person" can build just moved.

## The New Competitive Advantage

The industry will not reward comfort with old constraints. It will reward people who can adapt and innovate with the tools now available.

Snover called out where many leaders are stuck: prayer-based planning. That is what strategy looks like when we have not asked hard questions about control, leverage, and error in AI-enabled systems.

The differentiator is not "who knows the most commands."

The differentiator is:

- Who can update their mental model fastest.
- Who can combine domain expertise with AI-assisted execution.
- Who can turn ideas into durable outcomes without waiting for perfect conditions.

In practice, this means building the muscle to experiment, validate, and ship.

## Stop Prayer-Based Planning

If AI introduces probabilistic behavior, then pretending we can manage it with deterministic-era assumptions is operational theater.

Instead, teams need explicit answers to three questions:

1. Control: Where must outcomes be deterministic, and where is probabilistic acceptable?
2. Leverage: Where does AI create an order-of-magnitude gain for our team?
3. Error: What failure modes are tolerable, detectable, and recoverable?

Without those answers, AI strategy becomes buzzwords. With those answers, it becomes execution.

## Build a Plausible Theory of Success

Snover's point lands hard: stop half-assing strategy.

A Plausible Theory of Success for a PowerShell team should be concrete:

1. Define the class of problems where AI-assisted PowerShell will be your force multiplier.
2. Define non-negotiable guardrails for security, compliance, and quality.
3. Define feedback loops that expose errors quickly.
4. Define delivery patterns that can be repeated by the entire team, not one expert.
5. Define how you'll measure improvement in throughput, quality, and resilience.

This is how you turn uncertainty into advantage.

## A Practical Adaptation Playbook

If you want to act on this shift, start with a simple loop:

1. Pick one thing you previously considered "out of scope" for your background (for example, a GUI for an internal tool).
2. Use AI to scaffold the first version quickly.
3. Add quality guardrails: linting, tests, code review, and security checks.
4. Iterate in small cycles until it is usable.
5. Capture the pattern so your team can repeat it.
6. Document where AI output is trusted, reviewed, or rejected.
7. Revisit the rules monthly as capability and risk both evolve.

This is how constraints dissolve. Not in one breakthrough, but in repeated proof that you can now do what you used to avoid.

## Final Thought

If "we are all insane," then the good news is this: our old reality was the limiting factor, not our potential.

PowerShell Summit 2026 reflected a community learning to see differently. With AI in the loop, we can attempt work that used to feel off-limits, and we can do it with increasing speed and quality.

The world is changing from Is to Ish. The winners will be the builders and leaders who adapt their mindset, then operationalize that adaptation with a plausible theory of success.`
));

// 2. Using .NET Methods in PowerShell
posts.push(createMdx(
  'using-net-methods-in-powershell-with-practical-examples-youll-actually-reuse',
  'Using .NET Methods in PowerShell (with practical examples you\'ll actually reuse)',
  '2026-02-14',
  ['powershell', 'dotnet', 'scripting', 'tutorial'],
  `PowerShell is already sitting on top of .NET, which means you can call .NET types and methods directly whenever the built-in cmdlets don't quite fit, or when you want more control (performance, precision, or fewer dependencies). This post is a practical tour of the patterns I use most: string and path operations, file I/O, time, crypto/hashing, parsing/validation, collections, and a few "quality of life" helpers.

Everything below works great in PowerShell 7+ (cross-platform).

---

## How to call .NET from PowerShell (the 3 patterns)

### 1) Call static methods on a type

\`\`\`powershell
# Create a new GUID
[System.Guid]::NewGuid()
# Round to 2 decimals
[System.Math]::Round(3.14159, 2)
\`\`\`

### 2) Create an instance and call instance methods

\`\`\`powershell
# Build a string efficiently with StringBuilder
$sb = [System.Text.StringBuilder]::new()
$sb.Append("hello").Append(" ").Append("world").ToString()
\`\`\`

### 3) Use a type accelerator (short alias PowerShell provides)

\`\`\`powershell
# Use type accelerators for common .NET types
[datetime]::UtcNow
[regex]::Match("abc123", "\\d+").Value
\`\`\`

---

## 1) Strings: faster, cleaner transforms with .NET

When you need precise string operations, .NET is often clearer (and sometimes faster) than chaining PowerShell operators.

Trim, normalize whitespace, case-insensitive comparisons:

\`\`\`powershell
# Trim whitespace
$text = "  Jorge   "
$text.Trim()   # "Jorge"
# Case-insensitive comparison
[string]::Equals("A", "a", [System.StringComparison]::OrdinalIgnoreCase)  # True
\`\`\`

Null/empty and whitespace checks:

\`\`\`powershell
# Null/empty check
[string]::IsNullOrEmpty($text)       # False
# Whitespace-only check
[string]::IsNullOrWhiteSpace("   ")  # True
\`\`\`

Quick string helpers:

\`\`\`powershell
# Concatenate without +
[string]::Concat("Hello", " ", "world")
# Join a collection with a delimiter
[string]::Join(", ", @("a", "b", "c"))
# Case-insensitive contains
"Hello".Contains("he", [System.StringComparison]::OrdinalIgnoreCase)  # True
# Replace substring
"report-2026".Replace("2026", "2027")
\`\`\`

Use these when you want explicit behavior (like case-insensitive \`Contains\`) or you are building strings from collections without loops.

Safe formatting without concatenation:

\`\`\`powershell
# Starts/ends with comparison rules
"Report.csv".StartsWith("report", [System.StringComparison]::OrdinalIgnoreCase)
"Report.csv".EndsWith(".csv", [System.StringComparison]::OrdinalIgnoreCase)
# Invariant casing for stable comparisons
"i".ToUpperInvariant()
# Split with empty entries removed
"one,,two".Split(@(","), [System.StringSplitOptions]::RemoveEmptyEntries)
# Join with platform-specific newline
[string]::Join([System.Environment]::NewLine, @("a", "b"))
\`\`\`

\`\`\`powershell
# Format with placeholders
$user = "Jorge"
$count = 42
[string]::Format("User {0} has {1} items.", $user, $count)
\`\`\`

StringBuilder for building large strings efficiently:

\`\`\`powershell
# Build many lines efficiently
$sb = [System.Text.StringBuilder]::new()
1..5 | ForEach-Object { [void]$sb.AppendLine("Line $_") }
$sb.ToString()
\`\`\`

---

## 2) Regex: use \`[regex]\` for control and readability

PowerShell's \`-match\` is great, but \`[regex]\` gives you richer capabilities (named groups, options, multiple matches).

Extract all matches:

\`\`\`powershell
# Get all ticket IDs
$text = "Tickets: INC123, INC456, INC789"
[regex]::Matches($text, "INC\\d+").Value
\`\`\`

Named groups:

\`\`\`powershell
# Parse named groups
$log = "user=jorge status=200"
$m = [regex]::Match($log, "user=(?<user>\\w+)\\s+status=(?<status>\\d+)")
$m.Groups["user"].Value
$m.Groups["status"].Value
\`\`\`

Use RegexOptions (like case-insensitive):

\`\`\`powershell
# Case-insensitive regex match
[regex]::IsMatch("Hello", "^hello$", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
\`\`\`

---

## 3) Paths and filenames: stop fighting separators

PowerShell has \`Join-Path\`, but .NET gives you a consistent mental model and access to special folder locations.

Combine paths safely:

\`\`\`powershell
# Combine paths safely
[System.IO.Path]::Combine($HOME, "logs", "app.log")
\`\`\`

Get file name / extension:

\`\`\`powershell
# Extract file name and extension
[System.IO.Path]::GetFileName("/tmp/report.csv")      # "report.csv"
[System.IO.Path]::GetExtension("/tmp/report.csv")     # ".csv"
\`\`\`

Get a per-user "application data" folder (cross-platform):

\`\`\`powershell
# Get the per-user app data folder
[System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::ApplicationData)
\`\`\`

Temp files and extension changes:

\`\`\`powershell
# Get temp directory and random name
$tempRoot = [System.IO.Path]::GetTempPath()
$tempName = [System.IO.Path]::GetRandomFileName()
# Change extension without touching the file
[System.IO.Path]::ChangeExtension("/tmp/report.csv", ".json")
\`\`\`

Use these when you need OS-safe temp paths or you are manipulating file names without touching the file system.

---

## 4) File I/O: predictable encoding, fast reads/writes

PowerShell cmdlets are fine, but .NET is handy when you want explicit encoding or raw bytes.

More path and file-system helpers:

\`\`\`powershell
# Normalize to a full path
[System.IO.Path]::GetFullPath("./logs/app.log")
# Get the parent directory name
[System.IO.Path]::GetDirectoryName("/tmp/report.csv")
# Create a temp file name
[System.IO.Path]::GetTempFileName()
# Check file/directory existence
[System.IO.File]::Exists("/tmp/report.csv")
[System.IO.Directory]::Exists("/tmp")
# Enumerate subdirectories lazily
[System.IO.Directory]::EnumerateDirectories($HOME)
\`\`\`

Write text with explicit UTF-8 (no surprises):

\`\`\`powershell
# Write UTF-8 text explicitly
$path = [System.IO.Path]::Combine($HOME, "demo.txt")
[System.IO.File]::WriteAllText($path, "hello", [System.Text.Encoding]::UTF8)
\`\`\`

Read all text:

\`\`\`powershell
# Read UTF-8 text explicitly
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
\`\`\`

Write/read bytes (great for hashes, binary formats):

\`\`\`powershell
# Write raw bytes
$bytes = 0..255
[System.IO.File]::WriteAllBytes($path, $bytes)

# Read raw bytes
$readBytes = [System.IO.File]::ReadAllBytes($path)
$readBytes.Length
\`\`\`

Enumerate files without loading everything into memory:

\`\`\`powershell
# Stream file names without loading all at once
$root = $HOME
[System.IO.Directory]::EnumerateFiles($root, "*.log", [System.IO.SearchOption]::AllDirectories) |
  Select-Object -First 20
\`\`\`

\`\`\`powershell
# Read lines lazily (streaming)
[System.IO.File]::ReadLines($path) | Select-Object -First 5
# Append text without rewriting the file
[System.IO.File]::AppendAllText($path, "more")
# File size via FileInfo
$fileInfo = [System.IO.FileInfo]::new($path)
$fileInfo.Length
# Enumerate files with DirectoryInfo
$dirInfo = [System.IO.DirectoryInfo]::new($HOME)
$dirInfo.EnumerateFiles("*.log") | Select-Object -First 5
\`\`\`

---

## 5) Dates and time: UTC, ISO 8601, and duration math

Use .NET when you want explicit UTC handling or exact formatting.

UTC now:

\`\`\`powershell
# Get current UTC time
[datetime]::UtcNow
\`\`\`

ISO 8601 timestamp:

\`\`\`powershell
# ISO 8601 string
[datetime]::UtcNow.ToString("o")    # e.g. 2026-02-13T...
\`\`\`

Parse a timestamp safely:

\`\`\`powershell
# Parse exact date with invariant culture
[datetime]::ParseExact("2026-02-13", "yyyy-MM-dd", [System.Globalization.CultureInfo]::InvariantCulture)
\`\`\`

TimeSpan (durations):

\`\`\`powershell
# Measure elapsed time
$start = [datetime]::UtcNow
Start-Sleep -Milliseconds 250
$elapsed = [datetime]::UtcNow - $start
$elapsed.TotalMilliseconds
\`\`\`

DateTimeOffset and local time zone:

\`\`\`powershell
# Use DateTimeOffset for offset-aware timestamps
[System.DateTimeOffset]::UtcNow.ToString("o")
# Convert UTC to local time zone
$localZone = [System.TimeZoneInfo]::Local
[System.TimeZoneInfo]::ConvertTimeFromUtc([datetime]::UtcNow, $localZone)
\`\`\`

Use these when you care about offsets, need round-trippable timestamps, or must convert between time zones.

\`\`\`powershell
# Convert Unix epoch seconds to DateTimeOffset
[System.DateTimeOffset]::FromUnixTimeSeconds(1700000000)
# Build a TimeSpan from minutes
[System.TimeSpan]::FromMinutes(5)
# Measure elapsed time with Stopwatch
$sw = [System.Diagnostics.Stopwatch]::StartNew()
Start-Sleep -Milliseconds 120
$sw.Stop()
$sw.ElapsedMilliseconds
\`\`\`

---

## 6) Hashing and crypto: quick integrity checks

Compute SHA256 of a file (cross-platform):

\`\`\`powershell
# Open file and compute SHA256 hash
$path = [System.IO.Path]::Combine($HOME, "demo.txt")

$stream = [System.IO.File]::OpenRead($path)
try {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $hashBytes = $sha.ComputeHash($stream)
}
finally {
  $stream.Dispose()
}

# Convert hash bytes to hex
$hashHex = [System.Convert]::ToHexString($hashBytes).ToLowerInvariant()
$hashHex
\`\`\`

Generate random bytes (tokens, salts):

\`\`\`powershell
# Generate cryptographically strong random bytes
$bytes = [byte[]]::new(32)
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
# Encode as Base64 for storage or display
[System.Convert]::ToBase64String($bytes)
\`\`\`

\`\`\`powershell
# Hash a byte array directly (no stream)
$hashBytes2 = [System.Security.Cryptography.SHA256]::HashData(
  [System.Text.Encoding]::UTF8.GetBytes("hello")
)
[System.Convert]::ToHexString($hashBytes2).ToLowerInvariant()
\`\`\`

---

## 7) Parsing and validation helpers

\`\`\`powershell
# TryParse for integers
$intValue = 0
[int]::TryParse("42", [ref]$intValue)

# TryParseExact for dates
$parsedDate = [datetime]::MinValue
[datetime]::TryParseExact(
  "2026-02-13",
  "yyyy-MM-dd",
  [System.Globalization.CultureInfo]::InvariantCulture,
  [System.Globalization.DateTimeStyles]::None,
  [ref]$parsedDate
)

# TryParse for GUIDs
$parsedGuid = [guid]::Empty
[guid]::TryParse("5f2a1f7c-3f9a-4a6b-9a2e-1c5c1b2d3e4f", [ref]$parsedGuid)

# TryParse for enums
$day = [System.DayOfWeek]::Sunday
[System.Enum]::TryParse([System.DayOfWeek], "Friday", $true, [ref]$day)
\`\`\`

---

## 8) Small quality-of-life helpers I reuse everywhere

GUIDs:

\`\`\`powershell
# Create a GUID string
[guid]::NewGuid().ToString()
\`\`\`

Base64 encode/decode:

\`\`\`powershell
# Encode and decode Base64
$text = "hello"
$b64  = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($text))
$back = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64))
$back
\`\`\`

Version comparisons:

\`\`\`powershell
# Compare versions reliably
$v1 = [version]"7.4.1"
$v2 = [version]"7.5.0"
$v2 -gt $v1
\`\`\`

Environment and collections helpers:

\`\`\`powershell
# Platform-specific newline and env var lookup
[System.Environment]::NewLine
[System.Environment]::GetEnvironmentVariable("PATH")

# Empty typed array and LINQ Any
$emptyStrings = [System.Array]::Empty[string]()
[System.Linq.Enumerable]::Any([int[]]@(1, 2, 3))  # True
\`\`\`

\`\`\`powershell
# Expand environment variables in a string
[System.Environment]::ExpandEnvironmentVariables("%TEMP%\\demo.txt")
# Read command-line args for the current process
[System.Environment]::GetCommandLineArgs()

# Start a process with arguments and read output
$psi = [System.Diagnostics.ProcessStartInfo]::new(
  "pwsh",
  "-NoProfile -Command \`"Get-Date\`""
)
$psi.RedirectStandardOutput = $true
$psi.UseShellExecute = $false
$proc = [System.Diagnostics.Process]::Start($psi)
$proc.StandardOutput.ReadToEnd().Trim()
$proc.WaitForExit()
\`\`\`

\`\`\`powershell
# Use List for ordered data
$list = [System.Collections.Generic.List[string]]::new()
$list.Add("a")
$list.Add("b")
$list

# Use HashSet for fast membership checks
$set = [System.Collections.Generic.HashSet[string]]::new()
$set.Add("a")
$set.Contains("a")

# Use Dictionary with TryGetValue
$dict = [System.Collections.Generic.Dictionary[string, int]]::new()
$dict["a"] = 1
$value = 0
$found = $dict.TryGetValue("a", [ref]$value)

# Convert arrays with Array.ConvertAll
$numbers = [int[]]@(1, 2, 3)
$strings = [System.Array]::ConvertAll(
  $numbers,
  [System.Converter[int, string]]{ param($n) $n.ToString() }
)
$strings
\`\`\`

Use these for predictable newline handling, reading environment variables without cmdlet overhead, or working with empty/optional arrays.

---

## A simple rule for when to reach for .NET

If you find yourself writing a 6-line workaround for something "basic" (paths, encoding, hashing, parsing, precise formatting), check whether .NET already has a type built for it. PowerShell is an automation language, but .NET is an enormous standard library you get for free.

You can find a GitHub gist of all the mentioned examples here:  
[https://gist.github.com/jorgeasaurus/035847545f1f1ddbe9b950315a01e6b2](https://gist.github.com/jorgeasaurus/035847545f1f1ddbe9b950315a01e6b2)`
));

// 3. Bootstrap Your Intune Tenant
posts.push(createMdx(
  'bootstrap-your-intune-tenant-in-a-single-command',
  'Bootstrap Your Intune Tenant in a Single Command',
  '2025-12-28',
  ['powershell', 'intune', 'automation', 'microsoft-graph', 'devops'],
  `If you've ever spent an afternoon clicking through the Intune portal to build dynamic groups, compliance policies, device filters, Autopilot profiles, and a starter set of Conditional Access rules, you know how soul-crushing that rinse-and-repeat work can be. I wanted a way to turn a fresh tenant into a best-practice baseline without babysitting the portal. That's why I built **Intune Hydration Kit**—a PowerShell module that bootstraps an Intune tenant end to end with one command.

This post breaks down what the kit creates, how it keeps you safe, and the fastest ways to get it running.

## What It Builds for You

Intune Hydration Kit pulls the latest [OpenIntuneBaseline](https://github.com/SkipToTheEndpoint/OpenIntuneBaseline) and layers on the core objects I set up in every tenant:

- **Dynamic and static groups** for OS, manufacturer, Autopilot, ownership, licensing, and rollout rings (Pilot/UAT/Broad)
- **Device filters** for Windows, macOS, iOS, Android, and VM detection
- **Security baselines** (70+ Windows/macOS policies from OpenIntuneBaseline)
- **Compliance policies** for Windows, macOS, iOS, Android, and Linux
- **App protection** (Microsoft's App Protection Framework levels 1-3 for iOS/Android)
- **Mobile apps** (Company Portal, Teams, Slack, Spotify, and more)
- **Enrollment** (Autopilot deployment profiles + Enrollment Status Page)
- **Conditional Access starter pack** created **disabled** so you can review before enabling

Everything ships with idempotence baked in—the module skips objects you've already got, so you can re-run it safely as you iterate.

## Two Ways to Authenticate

You only need PowerShell 7 and the Graph authentication module (\`Install-Module Microsoft.Graph.Authentication\`).

Pick an auth mode:

- **Interactive**: perfect for manual runs while you test changes.
- **Client secret**: ideal for automation and CI/CD with an app registration.

Clouds beyond commercial are supported (\`Global\`, \`USGov\`, \`USGovDoD\`, \`Germany\`, \`China\`).

Required Graph permissions (for your user or app):

\`DeviceManagementConfiguration.ReadWrite.All\`
\`DeviceManagementServiceConfig.ReadWrite.All\`
\`DeviceManagementManagedDevices.ReadWrite.All\`
\`DeviceManagementScripts.ReadWrite.All\`
\`DeviceManagementApps.ReadWrite.All\`
\`Group.ReadWrite.All\`
\`Policy.Read.All\`
\`Policy.ReadWrite.ConditionalAccess\`
\`Application.Read.All\`
\`Directory.ReadWrite.All\`
\`LicenseAssignment.Read.All\`
\`Organization.Read.All\`

## Safety Nets

- **Hydration marker**: every object is stamped with \`Imported by Intune Hydration Kit\`, which is how deletes stay surgical.
- **Conditional Access protection**: CA policies are created **disabled** and only deleted when they remain disabled—no surprises in prod.
- **Preview everything**: PowerShell \`-WhatIf\` is respected everywhere, so you can dry-run before touching a tenant.

## Fastest Quick Start (Parameters)

\`\`\`powershell
# Install from PSGallery
Install-Module -Name IntuneHydrationKit -Scope CurrentUser

# Preview every target with interactive auth
Invoke-IntuneHydration -TenantId "your-tenant-guid" \`
    -Interactive \`
    -Create \`
    -All \`
    -WhatIf

# Run for real with a minimal set of targets
Invoke-IntuneHydration -TenantId "your-tenant-guid" \`
    -Interactive \`
    -Create \`
    -DynamicGroups \`
    -DeviceFilters \`
    -ComplianceTemplates \`
    -OpenIntuneBaseline
\`\`\`

## Structured Runs (Settings File)

If you want fully repeatable runs, drive everything from JSON:

\`\`\`json
{
  "tenant": {
    "tenantId": "00000000-0000-0000-0000-000000000000",
    "tenantName": "contoso.onmicrosoft.com"
  },
  "authentication": {
    "mode": "clientSecret",
    "clientId": "app-guid",
    "clientSecret": "your-secret",
    "environment": "Global"
  },
  "options": {
    "create": true,
    "delete": false,
    "dryRun": false
  },
  "imports": {
    "openIntuneBaseline": true,
    "complianceTemplates": true,
    "appProtection": true,
    "notificationTemplates": true,
    "enrollmentProfiles": true,
    "dynamicGroups": true,
    "staticGroups": true,
    "deviceFilters": true,
    "conditionalAccess": true,
    "mobileApps": true
  }
}
\`\`\`

Run it:

\`\`\`powershell
Invoke-IntuneHydration -SettingsPath ./settings.json
\`\`\`

## Pick Your Targets (Granular Switches)

Toggling scope is straightforward in parameter mode: \`-All\` turns on everything, or choose individual switches like \`-OpenIntuneBaseline\`, \`-AppProtection\`, \`-EnrollmentProfiles\`, \`-DynamicGroups\`, \`-StaticGroups\`, \`-DeviceFilters\`, \`-ConditionalAccess\`, \`-MobileApps\`, and \`-NotificationTemplates\`. The same toggles exist under the \`imports\` block in settings mode.

## Cleanup Without Nuking Prod

Delete mode is intentionally conservative. When you flip on \`-Delete\` (or \`"delete": true\` in settings):

- Only objects with the hydration marker are eligible.
- Conditional Access policies must still be disabled to be removed.
- Add \`-Force\` if you want to skip the confirmation prompt.

That makes it safe to test in a lab, iterate, and then cleanly remove the kit's artifacts.

## Logs and Reports

- **Console output** shows \`Created\`, \`Skipped\`, \`Deleted\`, and warnings as it runs.
- **Logs** land in your OS temp path (or a custom \`-ReportOutputPath\`), with timestamped files you can hand to auditors.
- **Reports** ship in Markdown and JSON (\`Hydration-Summary.md\` and \`Hydration-Summary.json\`), so you get a human-readable rundown plus machine-friendly data for automation.

## Why This Matters Now

Most Intune work is repeatable ceremony. Building a tenant by hand is slow, error-prone, and hard to audit. Intune Hydration Kit gives you:

- A consistent, opinionated baseline you can stand up in minutes.
- A reversible path—preview with \`-WhatIf\`, delete only what the kit created, and keep CA policies disabled until you're confident.
- A maintainable workflow—parameter mode for quick tests, settings mode for repeatable pipelines.

If you're tired of clicking through the portal or you just want a clean, auditable way to hydrate new tenants, give the module a spin. Start with a \`-WhatIf\`, review the reports, and then let PowerShell do the heavy lifting.

## Links

- [Intune Hydration Kit](https://intunehydrationkit.com)
- [GitHub - jorgeasaurus/IntuneHydrationKit](https://github.com/jorgeasaurus/Intune-Hydration-Kit)`
));

// 4. Finding WMI Usage
posts.push(createMdx(
  'finding-wmi-usage-before-microsoft-finds-it-for-you',
  'Finding WMI Usage Before Microsoft Finds It For You',
  '2025-10-12',
  ['powershell', 'wmi', 'cim', 'windows', 'scripting'],
  `Microsoft has a habit of deprecating things we've been using for years, and this time they're coming for WMI. Well, not WMI itself—just the way we've been accessing it. Starting with Windows 11 version 25H2, the WMIC command-line tool and those trusty old PowerShell WMI cmdlets are getting the axe.

If you're anything like me, you've probably got years worth of scripts littered with \`Get-WmiObject\` calls, some \`gwmi\` aliases for "efficiency," and maybe even a few \`wmic\` commands that you've been copy-pasting since the Windows 7 days. Time to find them all before your scripts start breaking in production.

## The Problem

Here's the thing: we've all known CIM cmdlets were the "right" way to do things for a while now. \`Get-CimInstance\` is better than \`Get-WmiObject\` in basically every way—faster, firewall-friendly, cross-platform. But switching requires actually finding all those legacy calls first.

And it's not just cmdlets. There are:

- Those WMI aliases you typed quickly at 2am (\`gwmi\`, \`iwmi\`, etc.)
- The \`wmic\` commands in your ancient batch files
- .NET \`ManagementClass\` references buried in your PowerShell modules
- COM objects like \`SWbemLocator\` that someone thought was a good idea in 2008

Manually grepping for all of these? That's a recipe for missing stuff.

## The Solution (Or: I Made a Thing)

I built **Find-WmiUsage** to scan codebases and surface every instance of legacy WMI usage. It's a PowerShell 7 function that leverages parallel processing to tear through thousands of files and tell you exactly where your tech debt is hiding.

### What Makes It Useful

**It catches everything.** The scanner looks for 15 different WMI patterns:

- All five legacy WMI cmdlets and their aliases
- The \`wmic\` command
- .NET classes from \`System.Management\`
- COM objects from the WMI scripting library

**It's fast.** Using PowerShell 7's \`ForEach-Object -Parallel\`, it processes multiple files concurrently. Scanning a repository with hundreds of scripts takes seconds, not minutes.

**It gives you context.** Results include the file path, line number, pattern matched, and the actual line of code. No hunting through files wondering what triggered a match.

### Quick Example

Scan your scripts directory:

\`\`\`powershell
git clone https://github.com/jorgeasaurus/Find-WmiUsage.git
cd Find-WmiUsage
. .\\Find-WmiUsage.ps1
Find-WmiUsage -Path C:\\Scripts
\`\`\`

Output tells you exactly what needs fixing:

\`\`\`
File                              LineNumber Pattern              LineText
----                              ---------- -------              --------
C:\\Scripts\\inventory.ps1                  12 (?i)\\bGet-WmiObject\\b Get-WmiObject -Class Win32_ComputerSystem
C:\\Scripts\\inventory.ps1                  45 (?i)\\bgwmi\\b          gwmi Win32_Service -Filter "State='Running'"
C:\\Scripts\\legacy-report.ps1              8 (?i)\\bwmic\\b           wmic process list brief
\`\`\`

Need audit-friendly output? Export to CSV or JSON:

\`\`\`powershell
Find-WmiUsage -Path C:\\MyModules -Output CSV -OutFile .\\wmi-audit.csv
\`\`\`

## Why This Matters Now

Microsoft isn't playing around with this deprecation:

- **Windows 11 24H2**: New installations already ship without WMIC
- **Windows 11 25H2**: Complete removal, no going back
- **Legacy WMI cmdlets**: Deprecated, with CIM as the official path forward

If you're managing enterprise environments, you've got scripts running on dozens (or hundreds) of systems. Finding and migrating legacy WMI usage before it becomes a breaking change is the difference between a planned migration and a production fire drill.

## The Migration Path

Once you've found your legacy WMI calls, here's the cheat sheet:

| Legacy | Modern |
|--------|--------|
| \`Get-WmiObject\` | \`Get-CimInstance\` |
| \`Invoke-WmiMethod\` | \`Invoke-CimMethod\` |
| \`Set-WmiInstance\` | \`Set-CimInstance\` |
| \`Remove-WmiObject\` | \`Remove-CimInstance\` |
| \`wmic process list\` | \`Get-CimInstance Win32_Process\` |

The syntax is slightly different, but the migration is usually straightforward:

**Before:**

\`\`\`powershell
Get-WmiObject -Class Win32_ComputerSystem
\`\`\`

**After:**

\`\`\`powershell
Get-CimInstance -ClassName Win32_ComputerSystem
\`\`\`

## Get It

The tool is available on GitHub with full source, comprehensive Pester tests (40 of them, all passing), and documentation.

**Key features:**

- Scans \`.ps1\`, \`.psm1\`, \`.psd1\` files by default (customizable)
- Can include or ignore commented lines
- Adjustable parallelism for large codebases
- Outputs to table, CSV, or JSON

**Requirements:**

- PowerShell 7.0+ (uses \`ForEach-Object -Parallel\`)
- Pester 5.0+ if you want to run the tests

## Final Thoughts

Look, we all have legacy code. That's not the problem. The problem is not knowing where it is when Microsoft decides to deprecate it.

Find-WmiUsage gives you visibility. Run it against your repositories, generate reports, hand them to your team, and start migrating before you're forced to. Your future self (and your incident response team) will thank you.

---

**Links:**

- [Microsoft's WMIC Removal Announcement](https://support.microsoft.com/en-us/topic/windows-management-instrumentation-command-line-wmic-removal-from-windows-e9e83c7f-4992-477f-ba1d-96f694b8665d)
- [Get-CimInstance Documentation](https://learn.microsoft.com/en-us/powershell/module/cimcmdlets/get-ciminstance)
- [Find-WmiUsage on GitHub](https://github.com/jorgeasaurus/Find-WmiUsage)`
));

console.log(`\nTotal posts created: ${posts.length}`);
console.log(JSON.stringify(posts.map(p => ({ slug: p.slug, title: p.title, date: p.date, description: p.description, tags: p.tags })), null, 2));
