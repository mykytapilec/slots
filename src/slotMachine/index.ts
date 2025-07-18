import * as PIXI from "pixi.js";
import { loadAssets } from "./assets";
import { createReels } from "./reels";
import { SpinControl } from "./spinControl";
import { createButton, highlightSymbol } from "./ui";

export class SlotMachine {
  private app: PIXI.Application;
  private reels: (PIXI.Container & { usedSymbols: string[] })[] = [];
  private spinControl!: SpinControl;
  private background!: PIXI.Sprite;
  private spinButton!: PIXI.Container;
  private highlightContainers: PIXI.Graphics[] = [];

  constructor(app: PIXI.Application) {
    this.app = app;
  }

  public async start() {
    await loadAssets();

    this.setup();
  }

  private setup() {
    const bgTexture = PIXI.Assets.get("casino-bg");
    if (bgTexture instanceof PIXI.Texture) {
      this.background = new PIXI.Sprite(bgTexture);
      this.background.width = this.app.renderer.width;
      this.background.height = this.app.renderer.height;
      this.app.stage.addChild(this.background);
    }

    const symbolSize = this.app.renderer.width / 8;

    this.reels = createReels(this.app, symbolSize) as (PIXI.Container & { usedSymbols: string[] })[];
    this.reels.forEach((reel) => this.app.stage.addChild(reel));

    this.spinControl = new SpinControl(this.reels);
    this.spinControl.onSpinComplete = () => {
      this.checkWinEffect();
    };

    this.spinButton = createButton(
      "SPIN",
      this.app.renderer.width / 2 - 75,
      this.app.renderer.height - 100,
      () => {
        if (!this.spinControl.isSpinning()) {
          this.clearHighlights();
          this.spinControl.startSpin();
        }
      }
    );

    this.app.stage.addChild(this.spinButton);
  }

  private checkWinEffect() {
    this.clearHighlights();

    const middleRowIndex = 1;
    const symbolsInMiddleRow = this.reels.map(
      (reel) => reel.children[middleRowIndex] as PIXI.Sprite
    );

    let pairs: number[][] = [];

    for (let i = 0; i < symbolsInMiddleRow.length - 1; i++) {
      const symbolA = symbolsInMiddleRow[i];
      const symbolB = symbolsInMiddleRow[i + 1];
      if (symbolA.texture === symbolB.texture) {
        pairs.push([i, i + 1]);
      }
    }

    if (pairs.length > 0) {
      if (
        pairs.some(
          (pair) => pair[0] === 0 && pairs.some((p) => p[0] === 1)
        )
      ) {
        symbolsInMiddleRow.forEach((sym) =>
          this.highlightContainers.push(
            highlightSymbol(sym, 0xffffff, 0.8, sym.parent!)
          )
        );
      } else {
        pairs.forEach(([i, j]) => {
          this.highlightContainers.push(
            highlightSymbol(symbolsInMiddleRow[i], 0xffff00, 0.8, symbolsInMiddleRow[i].parent!)
          );
          this.highlightContainers.push(
            highlightSymbol(symbolsInMiddleRow[j], 0xffff00, 0.8, symbolsInMiddleRow[j].parent!)
          );
        });
      }
    }
  }

  private clearHighlights() {
    this.highlightContainers.forEach((highlight) => {
      highlight.parent?.removeChild(highlight);
      highlight.destroy();
    });
    this.highlightContainers = [];
  }

  public resize() {
    const symbolSize = this.app.renderer.width / 8;
    const totalReels = 3;
    const totalSymbolsPerReel = 3;
    const reelsWidth = totalReels * symbolSize;
    const startX = (this.app.renderer.width - reelsWidth) / 2;
    const centerY = (this.app.renderer.height - symbolSize * totalSymbolsPerReel) / 2;

    this.reels.forEach((reel, i) => {
      reel.x = startX + i * symbolSize;
      reel.y = centerY;

      reel.children.forEach((child, j) => {
        const sprite = child as PIXI.Sprite;
        sprite.width = symbolSize;
        sprite.height = symbolSize;

        if (!this.spinControl.isSpinning()) {
          sprite.y = j * symbolSize;
        }
      });

      if (reel.mask instanceof PIXI.Graphics) {
        reel.mask.x = reel.x;
        reel.mask.y = reel.y;
      }
    });

    if (this.background) {
      this.background.width = this.app.renderer.width;
      this.background.height = this.app.renderer.height;
    }

    if (this.spinButton) {
      this.spinButton.x = this.app.renderer.width / 2 - 75;
      this.spinButton.y = this.app.renderer.height - 100;
    }
  }
}
