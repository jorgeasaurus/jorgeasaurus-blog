import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'menu'
  | 'dismiss'
  | 'home'
  | 'grid'
  | 'list'
  | 'device'
  | 'apps'
  | 'shield'
  | 'building'
  | 'spark'
  | 'person'
  | 'info'
  | 'folder'
  | 'rss'
  | 'play'
  | 'refresh'
  | 'filter'
  | 'share'
  | 'download'
  | 'chevron'
  | 'document'
  | 'panel'

const paths: Record<IconName, ReactNode> = {
  menu: <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" />,
  dismiss: <path d="M5 5l10 10M15 5L5 15" />,
  home: <path d="M3.5 9.2 10 3.8l6.5 5.4V16a1 1 0 0 1-1 1h-3.2v-4.2H7.7V17H4.5a1 1 0 0 1-1-1V9.2z" />,
  grid: <path d="M3.5 3.5h5v5h-5zM11.5 3.5h5v5h-5zM3.5 11.5h5v5h-5zM11.5 11.5h5v5h-5z" />,
  list: <path d="M7 5h9.5M7 10h9.5M7 15h9.5M3.5 5h.5M3.5 10h.5M3.5 15h.5" />,
  device: <path d="M3.5 5.5h13v8h-13zM7.5 16.5h5" />,
  apps: <path d="M4 4.5h5.2v5.2H4zM10.8 4.5H16v5.2h-5.2zM4 11.3h5.2V16.5H4zM10.8 11.3H16V16.5h-5.2z" />,
  shield: <path d="M10 3.2 16 5.4v4.7c0 3.3-2.3 5.5-6 6.7-3.7-1.2-6-3.4-6-6.7V5.4L10 3.2z" />,
  building: <path d="M4 16.5V5.2L10 3.2l6 2v11.3M8 16.5v-3h4v3M7.2 7.2h.6M10 7.2h.6M12.8 7.2h.6M7.2 10h.6M10 10h.6M12.8 10h.6" />,
  spark: <path d="M10 2.8v3.2M10 14v3.2M2.8 10h3.2M14 10h3.2M4.8 4.8l2.2 2.2M13 13l2.2 2.2M15.2 4.8 13 7M7 13l-2.2 2.2" />,
  person: <path d="M10 10.2a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4zM4.8 16.4c.7-2.4 2.6-3.6 5.2-3.6s4.5 1.2 5.2 3.6" />,
  info: <path d="M10 16.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM10 9v4.2M10 6.6h.01" />,
  folder: <path d="M3.2 6.2V15a1 1 0 0 0 1 1h11.6a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H10L8.4 5.2H4.2a1 1 0 0 0-1 1z" />,
  rss: <path d="M5 15.2a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM4.8 4.8v0a9.4 9.4 0 0 1 9.4 9.4M4.8 8.8a5.4 5.4 0 0 1 5.4 5.4" />,
  play: <path d="M7 4.8v10.4L15.2 10 7 4.8z" />,
  refresh: <path d="M16 10a6 6 0 1 1-1.6-4.1M16 3.8V8h-4.2" />,
  filter: <path d="M3.5 4.5h13l-5 6.2V16l-3-1.4v-4z" />,
  share: <path d="M7.2 11.2 12.8 14M12.8 6 7.2 8.8M5.6 12.2a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM14.4 7.4a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM14.4 16.2a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z" />,
  download: <path d="M10 3.5v9M6.2 9.2 10 13l3.8-3.8M4 16.2h12" />,
  chevron: <path d="M12.2 4.5 7 10l5.2 5.5" />,
  document: <path d="M6 3.2h5.2L15 7v9.8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.2a1 1 0 0 1 1-1zM11 3.4V7h3.6" />,
  panel: <path d="M3.5 4.5h13v11h-13zM8 4.5v11" />,
}

export default function AdminIcon({
  name,
  ...props
}: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="ac-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
