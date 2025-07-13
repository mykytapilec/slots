import * as PIXI from "pixi.js";
import { SlotMachine } from "./slotMachine";

async function main() {
  console.log("Creating PIXI app...");
  const app = new PIXI.Application();

  await app.init({
    width: 800,
    height: 600,
    backgroundColor: 0x1099bb,
  });

  console.log("PIXI app initialized and canvas added");
  document.body.appendChild(app.canvas);

  const slotMachine = new SlotMachine(app);
  await slotMachine.start();
}

main();
