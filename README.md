# PixiJS Slots Template

A modern PixiJS 8.x template project with asset pipeline, audio, navigation, and UI, powered by Vite and TypeScript.

## Features

- **PixiJS 8.x** with custom engine and plugin system
- **AssetPack** pipeline for asset management and manifest generation
- **Vite** for fast development and hot module reload
- **TypeScript** strict mode
- **Custom UI**: Buttons, sliders, popups, and screens
- **Audio**: BGM and SFX with volume controls
- **Responsive**: Resizes to window or container
- **ESLint** and **Prettier** for code quality

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)

### Install dependencies

```sh
npm install
```

### Run in development mode

```sh
npm start
```

This will start Vite on [http://localhost:8080](http://localhost:8080) and open your browser.

### Build for production

```sh
npm run build
```

### Lint the code

```sh
npm run lint
```

## Project Structure

- `src/` – Main source code (engine, app, screens, UI, etc.)
- `public/` – Static assets and styles
- `raw-assets/` – Source assets (images, sounds) for AssetPack
- `.assetpack/` – AssetPack cache and metadata
- `scripts/` – Build scripts and plugins
- `index.html` – Main HTML entry point

## Asset Pipeline

Assets in `raw-assets/` are processed by AssetPack and output to `public/assets/` with a manifest in `src/manifest.json`. The engine loads assets using this manifest.

## License

MIT © 2025 MIKITA