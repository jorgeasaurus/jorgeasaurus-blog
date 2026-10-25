import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'

export interface Crumb {
  label: string
  to?: string
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="ac-breadcrumb" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1 || !item.to
          return (
            <li key={`${item.label}-${index}`}>
              {item.to && !current ? (
                <Link to={item.to} onClick={item.onClick}>{item.label}</Link>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
