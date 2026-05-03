import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import rehypeHighlight from 'rehype-highlight'
import powershell from 'highlight.js/lib/languages/powershell'

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkGfm],
        rehypePlugins: [[rehypeHighlight, { languages: { powershell, ps1: powershell } }]],
      }),
    },
    react(),
  ],
  preview: { port: 3000 },
  server: { port: 3000, strictPort: true },
})
