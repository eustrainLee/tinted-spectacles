import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Tinted Spectacles',
  version: '0.0.1',
  description:
    'Match URLs and hide or overlay specific DOM regions (ads, promos, custom rules).',
  action: {
    default_popup: 'index.html',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
})
