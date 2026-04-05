# Tinted Spectacles

Chrome extension (MV3): match URLs and hide or overlay selected page regions. Scaffold stage; filtering rules are not implemented yet.

## Develop

```bash
yarn install
yarn dev
```

Load the unpacked folder printed by Vite (see CRXJS dev output) in `chrome://extensions`.

## Build

```bash
yarn build
```

Load the `dist` directory as an unpacked extension.

## Stack

TypeScript, React, Vite, [@crxjs/vite-plugin](https://github.com/crxjs/chrome-extension-tools).
