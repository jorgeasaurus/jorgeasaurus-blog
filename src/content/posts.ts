import { type PostMeta } from '../lib/posts'

const posts: PostMeta[] = [
  {
    slug: 'minimize-autopilot-device-preparation-provisioning-time',
    title: 'Minimize Provisioning Time with Autopilot Device Preparation',
    date: '2026-07-10',
    description:
      'Reduce Windows Autopilot device preparation time by shrinking the OOBE critical path, removing slow blockers, and measuring the work that remains.',
    tags: ['intune', 'windows', 'autopilot', 'endpoint-management', 'device-provisioning'],
    socialImage: {
      src: '/images/posts/minimize-autopilot-device-preparation-provisioning-time/socialcard.png',
      width: 1200,
      height: 630,
      type: 'image/png',
    },
  },
  {
    slug: 'why-i-built-endpoint-jobs',
    title: 'Why I Built Endpoint Jobs',
    date: '2026-07-01',
    description:
      'A project field note on building a focused endpoint engineering job board for the community.',
    tags: ['endpoint-management', 'career', 'community', 'automation', 'jobs'],
    socialImage: {
      src: '/images/posts/why-i-built-endpoint-jobs/socialcard.png',
      width: 1200,
      height: 630,
      type: 'image/png',
    },
  },
  {
    slug: 'make-yourself-obsolete',
    title: 'Make Yourself Obsolete',
    date: '2026-06-11',
    description:
      'A practical career note on turning repeated work into automation, documentation, and room for harder problems.',
    tags: ['career', 'engineering', 'automation', 'growth'],
    socialImage: {
      src: '/images/posts/make-yourself-obsolete/socialcard.png',
      width: 1200,
      height: 630,
      type: 'image/png',
    },
  },
  {
    slug: 'intune-gotchas-every-admin-learns-eventually',
    title: 'Intune Gotchas Every Admin Learns Eventually',
    date: '2026-06-10',
    description:
      'The Microsoft Intune behaviors that surprise admins most often, why they happen, and how to avoid getting burned by them.',
    tags: ['intune', 'endpoint-management', 'windows', 'security', 'device-management'],
    socialImage: {
      src: '/images/posts/intune-gotchas-every-admin-learns-eventually/socialcard.png',
      width: 1200,
      height: 630,
      type: 'image/png',
    },
  },
  {
    slug: 'intune-hydration-kit-has-a-tui-now',
    title: 'Intune Hydration Kit Has a TUI Now',
    date: '2026-06-01',
    description:
      'The v1.0.0 update makes Invoke-IntuneHydration safer to run by putting dry-run, scope, platform, and confirmation prompts in the default path.',
    tags: ['powershell', 'intune', 'automation', 'microsoft-graph', 'endpoint-management'],
    socialImage: {
      src: '/images/posts/intune-hydration-kit-has-a-tui-now/socialcard.png',
      width: 1200,
      height: 630,
      type: 'image/png',
    },
  },
  {
    slug: 'mmsmoa-2026-endpoint-management-is-engineering-now',
    title: 'MMSMOA 2026: Endpoint Management Is an Engineering Discipline Now',
    date: '2026-05-30',
    description:
      'A practical MMSMOA recap for Intune, Windows, security, PowerShell, and automation work that needs to survive real operations.',
    tags: ['intune', 'endpoint-management', 'powershell', 'automation', 'windows', 'security', 'conference'],
    socialImage: {
      src: '/images/posts/mmsmoa-2026-endpoint-management-is-engineering-now/socialcard.png',
      width: 1200,
      height: 630,
      type: 'image/png',
    },
  },
  {
    slug: 'reusable-intune-remediation-template',
    title: 'Build a Reusable Intune Remediation Template',
    date: '2026-05-25',
    description:
      'A reusable PowerShell pattern for Intune Remediations with predictable exit codes, logging, 64-bit handling, and portal-friendly output.',
    tags: ['powershell', 'intune', 'remediations', 'windows', 'scripting'],
    socialImage: {
      src: '/images/posts/reusable-intune-remediation-template/socialcard.png',
      width: 1200,
      height: 630,
      type: 'image/png',
    },
  },
  {
    slug: 'creating-dynamic-device-model-groups-in-entra-with-powershell',
    title: 'Creating Dynamic Device Model Groups in Entra with PowerShell',
    date: '2026-05-12',
    description:
      'A PowerShell walkthrough for creating OS-scoped dynamic Entra device groups based on Intune device models.',
    tags: ['powershell', 'intune', 'entra-id', 'microsoft-graph', 'automation'],
    socialImage: {
      src: '/images/posts/creating-dynamic-device-model-groups-in-entra-with-powershell/socialcard.png',
      width: 1536,
      height: 1024,
      type: 'image/png',
    },
  },
  {
    slug: 'set-up-and-view-app-inventory-data-in-intune',
    title: 'Set Up and View App Inventory Data in Intune',
    date: '2026-05-07',
    description:
      'App inventory gives you richer Windows app data in Intune, but only after you turn it on with a Properties catalog policy.',
    tags: ['intune', 'windows', 'device-management', 'application-inventory', 'tutorial'],
  },
  {
    slug: 'ai-agents-changed-how-i-build-things',
    title: 'AI Coding Agents Changed How I Build Things',
    date: '2026-05-05',
    description:
      "I used to think LLMs were just fancy autocomplete. Then I started letting them live inside my repos. Here's what changed.",
    tags: ['llm', 'ai', 'powershell', 'automation', 'github-copilot'],
  },
  {
    slug: 'hello-world',
    title: 'Hello, World',
    date: '2026-05-01',
    description: 'Welcome to my new blog. Built with React, Vite, and MDX.',
  },
  {
    slug: 'powershell-summit-2026-we-are-all-insane-and-that-is-the-opportunity',
    title: 'PowerShell Summit 2026: We Are All Insane, and That Is the Opportunity',
    date: '2026-04-18',
    description:
      'To quote Jeffrey Snover, "you are all insane." Not as an insult. As a diagnosis.',
    tags: ['powershell', 'ai', 'automation', 'career', 'conference'],
  },
  {
    slug: 'using-net-methods-in-powershell-with-practical-examples-youll-actually-reuse',
    title:
      "Using .NET Methods in PowerShell (with practical examples you'll actually reuse)",
    date: '2026-02-14',
    description:
      'PowerShell is already sitting on top of .NET. Here are the patterns I use most: strings, paths, file I/O, time, crypto, and more.',
    tags: ['powershell', 'dotnet', 'scripting', 'tutorial'],
  },
  {
    slug: 'bootstrap-your-intune-tenant-in-a-single-command',
    title: 'Bootstrap Your Intune Tenant in a Single Command',
    date: '2025-12-28',
    description:
      'Turn a fresh Intune tenant into a best-practice baseline without babysitting the portal using the Intune Hydration Kit PowerShell module.',
    tags: ['powershell', 'intune', 'automation', 'microsoft-graph', 'devops'],
  },
  {
    slug: 'finding-wmi-usage-before-microsoft-finds-it-for-you',
    title: 'Finding WMI Usage Before Microsoft Finds It For You',
    date: '2025-10-12',
    description:
      'Microsoft is deprecating WMIC and legacy WMI cmdlets. Find every instance in your codebase before your scripts start breaking in production.',
    tags: ['powershell', 'wmi', 'cim', 'windows', 'scripting'],
  },
  {
    slug: 'winget-without-winget-building-a-cross-platform-package-manifest-fetcher',
    title:
      'WinGet Without WinGet: Building a Cross-Platform Package Manifest Fetcher',
    date: '2025-07-20',
    description:
      'Query WinGet packages from macOS or Linux by hitting the winget-pkgs GitHub repo directly - no WinGet client required.',
    tags: ['powershell', 'winget', 'cross-platform', 'github-api', 'devops'],
  },
  {
    slug: 'supercharge-microsoft-graph-api-data-retrieval-with-powershell-batch-requests',
    title:
      'Supercharge Microsoft Graph API Data Retrieval with PowerShell Batch Requests',
    date: '2025-07-15',
    description:
      'Reduce Graph API data export times by up to 88% using batch requests and parallel processing. Real production metrics included.',
    tags: ['powershell', 'microsoft-graph', 'performance', 'api', 'automation'],
  },
  {
    slug: 'are-you-even-good-enough-to-have-imposter-syndrome',
    title: 'Are You Even Good Enough to Have Imposter Syndrome?',
    date: '2025-04-18',
    description:
      "Imposter syndrome doesn't go away. If anything, it scales with you. Here's how to use it as fuel rather than fear.",
    tags: ['career', 'growth', 'mental-health', 'engineering'],
  },
  {
    slug: 'back-up-or-restore-jamf-pro-objects-with-powershell',
    title: 'Back Up or Restore Jamf Pro Objects with PowerShell',
    date: '2025-03-23',
    description:
      'A PowerShell tool for backing up and restoring Jamf Pro configurations with selective exports, OAuth support, and organized backups.',
    tags: ['powershell', 'jamf', 'mdm', 'backup', 'automation'],
  },
  {
    slug: 'synchronizing-device-groups-with-entra-user-groups-using-powershell',
    title:
      'Synchronizing Device Groups with Entra User Groups Using PowerShell',
    date: '2025-02-03',
    description:
      'Given a list of usernames, automatically find their Intune-managed devices and sync them to a device group using parallel Graph API calls.',
    tags: ['powershell', 'intune', 'entra-id', 'microsoft-graph', 'automation'],
  },
  {
    slug: 'syncing-abm-and-vpp-tokens-with-intune-a-powershell-script-for-the-lazy-admin',
    title:
      'Syncing ABM and VPP Tokens with Intune: A PowerShell Script for the Lazy Admin',
    date: '2024-08-31',
    description:
      'Automate the manual process of syncing Apple Business Manager and Volume Purchase Program tokens in Microsoft Intune with PowerShell.',
    tags: ['powershell', 'intune', 'apple', 'abm', 'automation'],
  },
  {
    slug: 'automating-device-management-with-powershell-function-invoke-appinstalleddevicesgroup',
    title:
      'Automating Device Management with PowerShell: Function Invoke-AppInstalledDevicesGroup',
    date: '2024-03-03',
    description:
      'Build a device group in Intune based on detected application installs - automatically add and remove devices as software appears and disappears.',
    tags: ['powershell', 'intune', 'automation', 'microsoft-graph', 'scripting'],
  },
  {
    slug: 'intune-device-queries-to-level-up-your-device-management',
    title: '20+ Intune Device Queries to Level Up Your Device Management',
    date: '2024-02-19',
    description:
      'Leverage Kusto Query Language with Intune Device Query to gain deep insights into your device fleet, from BIOS info to installed applications.',
    tags: ['intune', 'kql', 'device-management', 'windows', 'microsoft'],
  },
  {
    slug: 'streamlining-application-detection-in-intune-and-mecm-with-powershell',
    title:
      'Streamlining Application Detection in Intune and MECM with PowerShell',
    date: '2024-01-05',
    description:
      'A PowerShell function for precise application detection across 32-bit, 64-bit, and user-context installs - perfect for Intune Win32 app detection.',
    tags: ['powershell', 'intune', 'mecm', 'application-detection', 'scripting'],
  },
  {
    slug: 'top-20-graph-api-cmdlets',
    title: 'Top 20 Graph API Cmdlets',
    date: '2023-07-31',
    description:
      'A practical tour of the 20 most useful Microsoft Graph PowerShell cmdlets for managing users, groups, devices, apps, and more in Microsoft 365.',
    tags: ['powershell', 'microsoft-graph', 'microsoft-365', 'automation', 'tutorial'],
  },
  {
    slug: 'using-filters-to-assign-apps-policies-and-profiles-in-microsoft-intune',
    title:
      'Using Filters to Assign Apps, Policies, and Profiles in Microsoft Intune',
    date: '2023-05-14',
    description:
      'A comprehensive guide to using Intune device filters to dynamically target devices based on properties like manufacturer, model, and OS version.',
    tags: ['intune', 'device-management', 'microsoft', 'tutorial'],
  },
  {
    slug: 'proactive-remediation-to-remind-windows-users-to-reboot',
    title: 'Proactive Remediation to Remind Windows Users to Reboot',
    date: '2023-05-07',
    description:
      "Use Intune Proactive Remediations to detect Windows devices that haven't rebooted in 7+ days and display a customizable toast notification reminder.",
    tags: ['intune', 'powershell', 'proactive-remediation', 'windows'],
  },
  {
    slug: 'find-registry-uninstall-keys-with-powershell',
    title: 'Find Registry Uninstall Keys with PowerShell',
    date: '2023-05-07',
    description:
      'A PowerShell function to search the Windows registry for uninstall keys matching a specified string, with support for 64-bit and 32-bit applications.',
    tags: ['powershell', 'windows', 'registry', 'scripting', 'uninstall'],
  },
]

export default posts
