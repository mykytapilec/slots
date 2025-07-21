import * as PIXI from "pixi.js";
import { SYMBOLS } from "./constants";

export async function loadAssets() {
  SYMBOLS.forEach((name) => {
    const url = `/symbols/${name}.png`;
    PIXI.Assets.add({ alias: name, src: url });
  });

  PIXI.Assets.add({ alias: "casino-bg", src: "/backgrounds/casino.jpg" });

  await PIXI.Assets.load([...SYMBOLS, "casino-bg"]);

  return SYMBOLS;
}
