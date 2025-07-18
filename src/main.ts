import * as PIXI from "pixi.js";
import { SlotMachine } from "./slotMachine/index";

let app: PIXI.Application;
let slotMachine: SlotMachine;

async function main() {
  console.log("Creating PIXI app...");

  app = new PIXI.Application();
  await app.init({
    resizeTo: window,
    backgroundColor: 0x1099bb,
  });

  console.log("PIXI app initialized and canvas added");
  document.body.appendChild(app.canvas);

  slotMachine = new SlotMachine(app);
  await slotMachine.start();
}

window.addEventListener("resize", () => {
  if (slotMachine) {
    slotMachine.resize();
  }
});

main();
