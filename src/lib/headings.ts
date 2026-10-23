export interface ArticleHeading {
  id: string
  text: string
  level: 2 | 3
}

export function slugifyHeading(value: string) {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'section'
}

export function scrollHeadingIntoView(target: HTMLElement, behavior: ScrollBehavior = 'auto') {
  const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0
  const top = target.getBoundingClientRect().top + window.scrollY - margin
  window.scrollTo({ top: Math.max(0, top), behavior })
}

export function collectHeadings(root: ParentNode): ArticleHeading[] {
  const used = new Set<string>()
  return [...root.querySelectorAll<HTMLHeadingElement>('h2, h3')].map((heading) => {
    const text = heading.textContent?.replace(/\s+/g, ' ').trim() || 'Section'
    const base = slugifyHeading(text)
    let id = heading.id && !used.has(heading.id) ? heading.id : base
    let suffix = 2
    while (used.has(id)) {
      id = `${base}-${suffix}`
      suffix += 1
    }
    used.add(id)
    heading.id = id
    heading.tabIndex = -1
    return {
      id,
      text,
      level: heading.tagName === 'H3' ? 3 : 2,
    }
  })
}
