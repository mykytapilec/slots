import * as PIXI from "pixi.js";
import { SYMBOLS } from "./assets";

export function createReels(app: PIXI.Application, symbolSize: number) {
  const reels: PIXI.Container[] = [];
  const totalReels = 3;
  const totalSymbolsPerReel = 3;
  const reelsWidth = totalReels * symbolSize;
  const startX = (app.renderer.width - reelsWidth) / 2;
  const centerY = (app.renderer.height - symbolSize * totalSymbolsPerReel) / 2;

  for (let i = 0; i < totalReels; i++) {
    const reel = new PIXI.Container();
    reel.x = startX + i * symbolSize;
    reel.y = centerY;

    for (let j = 0; j < totalSymbolsPerReel; j++) {
      const symbolName = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      const texture = PIXI.Assets.get(symbolName);
      if (!texture || !(texture instanceof PIXI.Texture)) continue;
      const sprite = new PIXI.Sprite(texture);
      sprite.width = symbolSize;
      sprite.height = symbolSize;
      sprite.y = j * symbolSize;
      reel.addChild(sprite);
    }

    reels.push(reel);
  }

  return reels;
}

export function updateReelsSpin(
  reels: PIXI.Container[],
  reelSpeeds: number[],
  symbolSize: number,
  totalSymbolsPerReel: number
) {
  for (let i = 0; i < reels.length; i++) {
    const reel = reels[i];
    reel.children.forEach((child) => {
      child.y += reelSpeeds[i];
    });

    reel.children.forEach((child) => {
      if (child.y >= symbolSize * totalSymbolsPerReel) {
        child.y -= symbolSize * totalSymbolsPerReel;
        const sprite = child as PIXI.Sprite;
        const newSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const newTexture = PIXI.Assets.get(newSymbol);
        if (newTexture instanceof PIXI.Texture) {
          sprite.texture = newTexture;
        }
      }
    });
  }
}

export function alignReelsSymbols(reels: PIXI.Container[], symbolSize: number) {
  reels.forEach((reel) => {
    reel.children.forEach((child, index) => {
      child.y = index * symbolSize;
    });
  });
}
