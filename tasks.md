# Design/UX Tasks

Recommended implementation sequence:

1. [x] Fix slug issues before changing article presentation.
2. [x] Make the AI agents post image a real article hero.
   - Place it full-width under the post title.
   - Add a subtle caption so it reads as editorial article media, not just "original media."
3. [x] Add previous/next post navigation at the bottom of articles.
   - Use a glass "Newer / Older field note" footer.
   - Give long posts a clear next action after the article body.
4. [x] Tighten the mobile topbar.
   - Reduce the current mobile topbar height.
   - Consider a tighter stacked layout or icon-only external links.
5. [x] Polish post heading hierarchy and captions.
   - Add subtle terminal-inspired h2/h3 treatment, such as a prompt marker, left rule, or green accent.
   - Style captions as designed lab notes with mono labels like `FIG. 01`.
6. [x] Add a compact reading-progress indicator.
   - Use a thin top-edge or side-rim progress line.
   - Keep it aligned with the terminal/glass aesthetic.
7. [ ] Add a featured image preview on the homepage card.
   - Give the latest AI agents card a small masked thumbnail or rim reflection.
   - Make the newest post feel more intentional and magazine-like.
   - Deferred for now to preserve the homepage glass-card aesthetic.
8. [x] Add a low-power/reduced-glass mode.
   - Respect `prefers-reduced-transparency` where supported.
   - Respect `prefers-reduced-motion`.
   - Provide a flatter fallback for accessibility and battery use.
9. [x] Add the `me.jpeg` photo to the about page.
   - Use the photo referred to as "m e dot jpeg."
   - Integrate it into the about page layout without crowding the existing content.
