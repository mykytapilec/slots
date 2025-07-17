# PIXI.js Slot Machine

A simple slot machine with three reels built using PIXI.js.

---

## Features

- 3 reels, each showing 3 visible symbols.
- Each reel contains 4 unique symbols (no repeats within a reel) for smooth scrolling.
- Masking limits the visible area to exactly 3 symbols per reel.
- "SPIN" button starts the spinning with smooth deceleration.
- Symbols randomize on each spin to ensure different outcomes.
- Winning symbols are highlighted when matches occur.
- Responsive resizing adapts to window size changes.

---

## Technologies

- [PIXI.js](https://pixijs.com/) — WebGL rendering library.
- TypeScript — for type safety and improved developer experience.
- ES6 modules.

---

## Installation and Running

1. Clone the repository:
   ```bash
   git clone https://github.com/mykytapilec/slots.git
   cd slot-machine

2. Install dependencies:
    npm install

3. Run the development server:
    npm run dev 
    or 
    npx vite

4. Open your browser and navigate to:
    http://localhost:5173
    
## Project Structure
slotMachine.ts — Main SlotMachine class handling logic and rendering.
/symbols/ — Folder containing symbol images.
/backgrounds/ — Folder with background images.
index.html — Basic HTML page to load the app.

## Usage
Click the SPIN button to start the reels spinning.
Symbols scroll at different speeds and gradually decelerate.
After stopping, symbols align and matches on the middle row are highlighted.
Resize the browser window — the layout adjusts automatically.

## Adding New Symbols
Add PNG files of new symbols to the /symbols/ folder.
Add their names to the SYMBOLS array in slotMachine.ts.
Ensure the images are uniform in size with transparent backgrounds.

License
MIT License © Mikita Pilets