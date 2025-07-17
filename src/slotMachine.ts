import * as PIXI from "pixi.js";

const SYMBOLS = ["armor", "forest", "goblin", "milk"];

export class SlotMachine {
  private app: PIXI.Application;
  private reels: PIXI.Container[] = [];
  private spinTicker = new PIXI.Ticker();
  private spinTime = 0;
  private spinDuration = 3000; // 3 секунды прокрутки
  private spinning = false;

  private background!: PIXI.Sprite;
  private spinButton!: PIXI.Container;

  private reelSpeeds: number[] = [];
  private reelBaseSpeeds = [1.5, 1.0, 0.7]; // разные скорости колонок
  private decelerationStartTime = 2000; // время начала замедления (мс)

  // Для подсветки выигрыша
  private highlightContainers: PIXI.Container[] = [];

  constructor(app: PIXI.Application) {
    this.app = app;
    this.spinTicker.stop();
  }

  public async start() {
    console.log("Start loading assets...");
    try {
      await this.loadAssets();
      console.log("Assets loaded. Starting setup...");
      this.setup();
      console.log("Setup complete.");
    } catch (err) {
      console.error("Asset loading failed:", err);
    }
  }

  private async loadAssets() {
    SYMBOLS.forEach((name) => {
      const url = `/symbols/${name}.png`;
      PIXI.Assets.add({ alias: name, src: url });
    });

    PIXI.Assets.add({ alias: "casino-bg", src: "/backgrounds/casino.jpg" });

    await PIXI.Assets.load([...SYMBOLS, "casino-bg"]);
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
    const totalReels = 3;
    const totalSymbolsPerReel = 3;
    const reelsWidth = totalReels * symbolSize;
    const startX = (this.app.renderer.width - reelsWidth) / 2;
    const centerY = (this.app.renderer.height - symbolSize * totalSymbolsPerReel) / 2;

    for (let i = 0; i < totalReels; i++) {
      const reel = new PIXI.Container();
      reel.x = startX + i * symbolSize;
      reel.y = centerY; // Фиксируем вертикальную позицию барабана

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

      this.reels.push(reel);
      this.app.stage.addChild(reel);
    }

    this.spinButton = this.createButton(
      "SPIN",
      this.app.renderer.width / 2 - 75,
      this.app.renderer.height - 100,
      () => this.spin()
    );
    this.app.stage.addChild(this.spinButton);

    this.reelSpeeds = [...this.reelBaseSpeeds];

    this.spinTicker.add((ticker) => {
      const deltaMS = ticker.deltaMS;
      this.updateSpin(deltaMS);
    });
  }

  private createButton(
    text: string,
    x: number,
    y: number,
    onClick: () => void
  ): PIXI.Container {
    const button = new PIXI.Container();
    button.interactive = true;
    button.cursor = "pointer";

    const graphics = new PIXI.Graphics();
    graphics.beginFill(0x333333);
    graphics.drawRoundedRect(0, 0, 150, 50, 10);
    graphics.endFill();
    button.addChild(graphics);

    const buttonText = new PIXI.Text(text, {
      fill: "white",
      fontSize: 24,
    });
    buttonText.anchor.set(0.5);
    buttonText.x = 75;
    buttonText.y = 25;
    button.addChild(buttonText);

    button.x = x;
    button.y = y;

    button.on("pointerdown", onClick);

    return button;
  }

  private spin() {
    if (this.spinning) return;
    this.spinning = true;
    this.spinTime = 0;
    this.reelSpeeds = [...this.reelBaseSpeeds];
    this.clearHighlights();
    this.spinTicker.start();
  }

  private updateSpin(deltaMS: number) {
    this.spinTime += deltaMS;

    if (this.spinTime >= this.decelerationStartTime) {
      const elapsedSinceDecel = this.spinTime - this.decelerationStartTime;
      const decelDuration = this.spinDuration - this.decelerationStartTime;

      for (let i = 0; i < this.reelSpeeds.length; i++) {
        const newSpeed =
          this.reelBaseSpeeds[i] * (1 - elapsedSinceDecel / decelDuration);
        this.reelSpeeds[i] = Math.max(newSpeed, 0);
      }
    }

    const symbolSize = this.app.renderer.width / 8;
    const totalSymbolsPerReel = 3;

    for (let i = 0; i < this.reels.length; i++) {
      const reel = this.reels[i];
      reel.y = (this.app.renderer.height - symbolSize * totalSymbolsPerReel) / 2; // фиксируем контейнер

      reel.children.forEach((child) => {
        child.y += this.reelSpeeds[i];
      });

      // Циклический перенос символов при выходе за нижнюю границу
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

    // Остановка при завершении времени и нулевой скорости
    if (
      this.spinTime >= this.spinDuration &&
      this.reelSpeeds.every((speed) => speed <= 0.01)
    ) {
      this.spinTicker.stop();
      this.spinning = false;

      // Выравнивание символов в барабанах по фиксированным позициям
      this.reels.forEach((reel) => {
        reel.children.forEach((child, index) => {
          child.y = index * symbolSize;
        });
      });

      this.checkWinEffect();
    }
  }

  private checkWinEffect() {
    this.clearHighlights();

    // Берём символы в среднем ряду (индекс 1)
    const middleRowIndex = 1;
    const symbolsInMiddleRow = this.reels.map((reel) =>
      reel.children[middleRowIndex]
    ) as PIXI.Sprite[];

    // Проверяем совпадения соседних символов
    let pairs: number[][] = [];

    for (let i = 0; i < symbolsInMiddleRow.length - 1; i++) {
      const symbolA = symbolsInMiddleRow[i];
      const symbolB = symbolsInMiddleRow[i + 1];
      if (symbolA.texture === symbolB.texture) {
        pairs.push([i, i + 1]);
      }
    }

    if (pairs.length > 0) {
      // Если три подряд (0-1 и 1-2), считаем это три в ряд
      if (
        pairs.some(
          (pair) => pair[0] === 0 && pairs.some((p) => p[0] === 1)
        )
      ) {
        // 3 символа подряд совпали
        this.highlightSymbols(symbolsInMiddleRow, 0xffffff, 0.8);
      } else {
        // Подсветить пары соседних символов
        pairs.forEach(([i, j]) => {
          this.highlightSymbol(symbolsInMiddleRow[i], 0xffff00, 0.8);
          this.highlightSymbol(symbolsInMiddleRow[j], 0xffff00, 0.8);
        });
      }
    }
  }

  private highlightSymbols(
    symbols: PIXI.Sprite[],
    color: number,
    alpha: number
  ) {
    symbols.forEach((sym) => this.highlightSymbol(sym, color, alpha));
  }

  private highlightSymbol(symbol: PIXI.Sprite, color: number, alpha: number) {
    const highlight = new PIXI.Graphics();
    highlight.beginFill(color, alpha);
    highlight.drawRect(0, 0, symbol.width, symbol.height);
    highlight.endFill();

    highlight.x = symbol.x;
    highlight.y = symbol.y;

    if (symbol.parent) {
      symbol.parent.addChild(highlight);
      this.highlightContainers.push(highlight);
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
      reel.y = centerY; // фиксируем вертикальную позицию барабана

      reel.children.forEach((child, j) => {
        const sprite = child as PIXI.Sprite;
        sprite.width = symbolSize;
        sprite.height = symbolSize;

        // Выравниваем позицию по вертикали, только если не крутится
        if (!this.spinning) {
          sprite.y = j * symbolSize;
        }
      });
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
