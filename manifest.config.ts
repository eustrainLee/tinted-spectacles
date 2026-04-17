import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Tinted Spectacles',
  version: '0.0.1',
  description:
    'Match URLs and hide or overlay specific DOM regions (ads, promos, custom rules).',
  permissions: ['storage', 'activeTab'],
  icons: {
    '16': 'icons/icon-128.png',
    '32': 'icons/icon-128.png',
    '48': 'icons/icon-128.png',
    '128': 'icons/icon-128.png',
  },
  action: {
    default_popup: 'index.html',
    default_title: 'Tinted Spectacles',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
})
