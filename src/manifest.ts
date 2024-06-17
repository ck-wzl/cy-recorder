import fs from 'fs-extra'
import type { Manifest } from 'webextension-polyfill'
import type PkgType from '../package.json'
import { isDev, isFirefox, port, r } from '../scripts/utils'

export async function getManifest() {
  const pkg = await fs.readJSON(r('package.json')) as typeof PkgType

  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: 3,
    name: pkg.displayName || pkg.name,
    version: pkg.version,
    description: pkg.description,
    action: {
      default_icon: './assets/icon-256.png',
      default_popup: './dist/popup/index.html',
      default_title: 'Cypress Recorder'
    },
    options_ui: {
      page: './dist/options/index.html',
    },
    background: isFirefox
      ? { scripts: ['dist/background/index.mjs'], type: 'module', }
      : { service_worker: './dist/background/index.mjs', },
    icons: {
      16: './assets/icon-256.png',
      48: './assets/icon-256.png',
      128: './assets/icon-256.png',
    },
    permissions: [
      'tabs',
      'storage',
      'activeTab',
      'scripting',
      'webNavigation'
    ],
    host_permissions: ['*://*/*'],
    content_scripts: [
      {
        matches: ['<all_urls>',],
        js: ['dist/contentScripts/index.global.js',],
      },
    ],
    web_accessible_resources: [
      {
        resources: ['dist/contentScripts/style.css'],
        matches: ['<all_urls>'],
      },
    ],
    content_security_policy: {
      extension_pages: isDev
        // this is required on dev for Vite script to load
        ? `script-src \'self\' http://localhost:${port}; object-src \'self\'`
        : 'script-src \'self\'; object-src \'self\'',
    },
  }

  return manifest
}
