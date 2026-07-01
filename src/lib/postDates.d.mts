interface DatedPost {
  date: string
}

export function parsePostDate(dateStr: string): Date
export function formatPostDate(dateStr: string): string
export function comparePostDatesDesc(a: DatedPost, b: DatedPost): number
export function formatPostDateIso(dateStr: string): string
export function formatPostRssDate(dateStr: string): string
