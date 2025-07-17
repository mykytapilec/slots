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
  private reelBaseSpeeds = [15, 10, 7]; // Скорость в пикселях за тик, увеличил для видимой прокрутки
  private decelerationStartTime = 2000; // время начала замедления (мс)

  private highlightContainers: PIXI.Container[] = [];

  constructor(app: PIXI.Application) {
    this.app = app;
    this.spinTicker.stop();
  }

  public async start() {
    await this.loadAssets();
    this.setup();
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
    const visibleSymbols = 3;
    const reelSymbolsCount = visibleSymbols + 1; // 4 символа, чтобы при прокрутке не было пустот
    const reelsWidth = totalReels * symbolSize;
    const startX = (this.app.renderer.width - reelsWidth) / 2;
    const startY = (this.app.renderer.height - symbolSize * visibleSymbols) / 2;

    for (let i = 0; i < totalReels; i++) {
      const reel = new PIXI.Container();
      reel.x = startX + i * symbolSize;
      reel.y = startY;

      // Создаем маску, ограничивающую высоту области видимости 3 символами
      const mask = new PIXI.Graphics();
      mask.beginFill(0xffffff);
      mask.drawRect(0, 0, symbolSize, symbolSize * visibleSymbols);
      mask.endFill();
      reel.addChild(mask);
      reel.mask = mask;

      // Заполняем барабан 4 уникальными символами
      const availableSymbols = [...SYMBOLS];
      for (let j = 0; j < reelSymbolsCount; j++) {
        const randomIndex = Math.floor(Math.random() * availableSymbols.length);
        const symbolName = availableSymbols.splice(randomIndex, 1)[0];

        const texture = PIXI.Assets.get(symbolName);
        if (!texture || !(texture instanceof PIXI.Texture)) continue;

        const sprite = new PIXI.Sprite(texture);
        sprite.width = symbolSize;
        sprite.height = symbolSize;
        sprite.y = j * symbolSize;
        (sprite as any).symbolName = symbolName;

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

    // Для каждого барабана перемешиваем символы заново, чтобы результат менялся
    this.reels.forEach((reel) => {
      // Удаляем все символы из барабана, кроме маски (первый ребенок - маска)
      while (reel.children.length > 1) {
        const child = reel.children[1];
        reel.removeChild(child);
        child.destroy();
      }

      const symbolSize = this.app.renderer.width / 8;
      const visibleSymbols = 3;
      const reelSymbolsCount = visibleSymbols + 1;

      const availableSymbols = [...SYMBOLS];
      for (let j = 0; j < reelSymbolsCount; j++) {
        const randomIndex = Math.floor(Math.random() * availableSymbols.length);
        const symbolName = availableSymbols.splice(randomIndex, 1)[0];

        const texture = PIXI.Assets.get(symbolName);
        if (!texture || !(texture instanceof PIXI.Texture)) continue;

        const sprite = new PIXI.Sprite(texture);
        sprite.width = symbolSize;
        sprite.height = symbolSize;
        sprite.y = j * symbolSize;
        (sprite as any).symbolName = symbolName;

        reel.addChild(sprite);
      }
    });

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
    const visibleSymbols = 3;
    const reelSymbolsCount = visibleSymbols + 1;

    for (let i = 0; i < this.reels.length; i++) {
      const reel = this.reels[i];
      reel.y = (this.app.renderer.height - symbolSize * visibleSymbols) / 2;

      reel.children.forEach((child, idx) => {
        if (idx === 0) return; // маска не трогаем

        child.y += this.reelSpeeds[i];
      });

      reel.children.forEach((child, idx) => {
        if (idx === 0) return; // маска не трогаем

        if (child.y >= symbolSize * reelSymbolsCount) {
          child.y -= symbolSize * reelSymbolsCount;

          const sprite = child as PIXI.Sprite;

          // Проверяем текущие символы кроме этого спрайта
          const currentSymbols = reel.children
            .filter((c, ci) => ci !== idx && ci !== 0)
            .map((c) => (c as any).symbolName);

          const availableSymbols = SYMBOLS.filter(
            (s) => !currentSymbols.includes(s)
          );

          let newSymbol: string;
          if (availableSymbols.length === 0) {
            newSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          } else {
            newSymbol =
              availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
          }

          (sprite as any).symbolName = newSymbol;

          const newTexture = PIXI.Assets.get(newSymbol);
          if (newTexture instanceof PIXI.Texture) {
            sprite.texture = newTexture;
          }
        }
      });
    }

    if (
      this.spinTime >= this.spinDuration &&
      this.reelSpeeds.every((speed) => speed <= 0.01)
    ) {
      this.spinTicker.stop();
      this.spinning = false;

      // Зафиксировать позиции символов — ровно по символу, чтобы не было смещения
      this.reels.forEach((reel) => {
        reel.children.forEach((child, idx) => {
          if (idx === 0) return; // маска
          child.y = (idx - 1) * symbolSize; // -1, потому что idx=0 — маска
        });
      });

      this.checkWinEffect();
    }
  }

  private checkWinEffect() {
    this.clearHighlights();

    const middleRowIndex = 1; // второй символ в наборе из 3 видимых

    const symbolsInMiddleRow = this.reels.map((reel) => {
      // Учитывая, что первый ребенок - маска, берем второй, третий и т.д.
      return reel.children[middleRowIndex + 1] as PIXI.Sprite;
    });

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
        pairs.some((pair) => pair[0] === 0) &&
        pairs.some((pair) => pair[0] === 1)
      ) {
        // 3 подряд
        this.highlightSymbols(symbolsInMiddleRow, 0xffffff, 0.8);
      } else {
        pairs.forEach(([i, j]) => {
          this.highlightSymbol(symbolsInMiddleRow[i], 0xffff00, 0.8);
          this.highlightSymbol(symbolsInMiddleRow[j], 0xffff00, 0.8);
        });
      }
    }
  }

  private highlightSymbols(symbols: PIXI.Sprite[], color: number, alpha: number) {
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
    const visibleSymbols = 3;

    const reelsWidth = totalReels * symbolSize;
    const startX = (this.app.renderer.width - reelsWidth) / 2;
    const startY = (this.app.renderer.height - symbolSize * visibleSymbols) / 2;

    this.reels.forEach((reel, i) => {
      reel.x = startX + i * symbolSize;
      reel.y = startY;

      reel.children.forEach((child, j) => {
        if (j === 0) {
          // Маска
          const mask = reel.mask as PIXI.Graphics;
          if (mask) {
            mask.clear();
            mask.beginFill(0xffffff);
            mask.drawRect(0, 0, symbolSize, symbolSize * visibleSymbols);
            mask.endFill();
          }
          return;
        }
        const sprite = child as PIXI.Sprite;
        sprite.width = symbolSize;
        sprite.height = symbolSize;

        if (!this.spinning) {
          sprite.y = (j - 1) * symbolSize; // смещение из-за маски на 0 индексе
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
