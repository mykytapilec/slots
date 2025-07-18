import * as PIXI from "pixi.js";
import { SYMBOLS } from "./assets";

function getUniqueSymbols(count: number): string[] {
  const symbols = [...SYMBOLS];
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }
  return symbols.slice(0, count);
}

export function createReels(app: PIXI.Application, symbolSize: number) {
  const reels: (PIXI.Container & { usedSymbols: string[] })[] = [];
  const totalReels = 3;
  const visibleSymbols = 3;
  const totalSymbolsPerReel = visibleSymbols + 1;

  const reelsWidth = totalReels * symbolSize;
  const startX = (app.renderer.width - reelsWidth) / 2;
  const startY = (app.renderer.height - symbolSize * visibleSymbols) / 2;

  for (let i = 0; i < totalReels; i++) {
    const reel = new PIXI.Container() as PIXI.Container & { usedSymbols: string[] };
    reel.x = startX + i * symbolSize;
    reel.y = startY;

    const mask = new PIXI.Graphics();
    mask.beginFill(0x000000);
    mask.drawRect(0, 0, symbolSize, symbolSize * visibleSymbols);
    mask.endFill();
    mask.x = reel.x;
    mask.y = reel.y;
    app.stage.addChild(mask);
    reel.mask = mask;

    const uniqueSymbols = getUniqueSymbols(totalSymbolsPerReel);
    reel.usedSymbols = [...uniqueSymbols];

    for (let j = 0; j < totalSymbolsPerReel; j++) {
      const name = uniqueSymbols[j];
      const texture = PIXI.Assets.get(name);
      if (!(texture instanceof PIXI.Texture)) continue;

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
  reels: (PIXI.Container & { usedSymbols: string[] })[],
  reelSpeeds: number[],
  symbolSize: number,
  totalSymbolsPerReel: number
) {
  for (let i = 0; i < reels.length; i++) {
    const reel = reels[i];

    reel.children.forEach((child) => {
      child.y += reelSpeeds[i];
    });

    for (let j = 0; j < reel.children.length; j++) {
      const sprite = reel.children[j] as PIXI.Sprite;
      if (sprite.y >= symbolSize * totalSymbolsPerReel) {
        sprite.y -= symbolSize * totalSymbolsPerReel;

        reel.usedSymbols.shift();

        const availableSymbols = SYMBOLS.filter(s => !reel.usedSymbols.includes(s));

        const newSymbol = availableSymbols.length > 0
          ? availableSymbols[Math.floor(Math.random() * availableSymbols.length)]
          : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

        reel.usedSymbols.push(newSymbol);

        const newTexture = PIXI.Assets.get(newSymbol);
        if (newTexture instanceof PIXI.Texture) {
          sprite.texture = newTexture;
        }
      }
    }
  }
}

export function alignReelsSymbols(reels: PIXI.Container[], symbolSize: number) {
  reels.forEach((reel) => {
    reel.children.forEach((child, index) => {
      child.y = index * symbolSize;
    });
  });
}
