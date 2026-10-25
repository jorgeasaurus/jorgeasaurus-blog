import type { IconName } from './icons'

export interface TopicBlade {
  slug: string
  label: string
  hint: string
  icon: IconName
}

// Intune-like nav labels for the blog's real categories.
// AI notes and Career stay literal because those shelves are not Intune areas.
export const topicBlades: TopicBlade[] = [
  { slug: 'intune', label: 'Devices', hint: 'Intune', icon: 'device' },
  { slug: 'powershell', label: 'Apps', hint: 'PowerShell', icon: 'apps' },
  { slug: 'endpoint-management', label: 'Endpoint security', hint: 'Endpoint management', icon: 'shield' },
  { slug: 'microsoft-graph', label: 'Tenant admin', hint: 'Microsoft Graph', icon: 'building' },
  { slug: 'ai', label: 'AI notes', hint: 'AI', icon: 'spark' },
  { slug: 'career', label: 'Career', hint: 'Career', icon: 'person' },
]
