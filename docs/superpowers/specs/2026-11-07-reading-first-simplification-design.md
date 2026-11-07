# Reading-first simplification

Approved by Jorge on 2026-11-07. Approach 2: quiet the classic reader and delete the admin theme so one interface remains.

## Purpose

The site is a field notebook. The page should read as a list or a document. Glass over the Colchuck Lake photo stays, including the license credit. Article bodies, assets, the post registry, and public URLs stay.

## One interface

Delete `src/admin/`, `src/styles/admin-center.css`, and the theme module (`src/theme/`). Do not replace them with another theme abstraction.

`?theme=admin`, `?theme=classic`, a stored `blog-theme=admin` value, and a `blog-theme` cookie all render the same reader. The document boot script that applied a theme before paint is removed, so a stored admin value cannot paint a second interface. Blocked storage and blocked cookies do not throw and do not change the reader. The address bar may keep a legacy `theme` query. Listing links do not add one. There is no theme control.

## Headings

- Home: the nav wordmark is the only `h1` (`Jorgeasaurus`). A visually hidden `h2` names the list `Posts`.
- About: `h1` stays `Jorge Suarez`. The nav wordmark is a link.
- Projects: `h1` is `Projects`. The nav wordmark is a link.
- Article: `h1` is the post title.

This corrects an earlier line that would have made the wordmark an `h1` on About and Projects as well. Two `h1` elements on those pages would fight.

## Visible copy removed

Home drops the hero: tagline, purpose sentence, and the second profile-link row. Microsoft MVP stays on About. Cards drop `Latest dispatch`, the sequence number, and `Read field note`. They keep the date, reading time, title, description, and category and keyword links. The first unfiltered card may stay visually featured.

Filters keep the category pills, counts, keyword select, and `Clear filter`. The visible `Keyword` label becomes visually hidden and keeps the accessible name `Keyword`. The count line (`39 posts`, `1 post`) goes. `No posts match these filters.` stays. `Category:` and `Tagged:` headings go. The pressed pill and the select show the filter.

The newsletter keeps `Get new field notes`, `Email address`, and `Notify me`. It drops `Email list`, the extra sentence, and the idle “no spam” line. Status text appears only while joining, on success, and on error.

About drops the `About` eyebrow. Projects drops the eyebrow, the intro sentence, the `Featured` and `Open source` eyebrows, and the kind line. `Live projects` and `Repos and experiments` stay. Outbound link text stays.

The article keeps one `Copy link` under the title. The footer keeps `Back to top` only. Adjacent notes show the other title. The accessible name starts with `Older:` or `Newer:`. The desktop outline keeps `aria-label="On this page"` and drops the visible label. The mobile toggle keeps the visible words. A missing post keeps `Post Not Found` and gains `Back to home`.

The wordmark is fully visible at 320px and 390px.

## Left alone

Routes, redirects, MDX, `posts.ts`, images, RSS, sitemap, canonical URLs, robots rules, JSON-LD, `/api/subscribe`, the social-card page, and the newsletter email template. The social card and the email template may still say `Learn. Build. Automate.` They are not the reader.

## Tests

Assert the behavior above. Do not assert retired copy or card sequence numbers. The tag-uniqueness check looks at the cards on the page, not at `No. 33`. Admin-only tests are deleted. Classic nav fit, legacy theme URLs, stored admin, and blocked storage stay covered.
