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
      console.log(`Adding asset: ${name} from ${url}`);
      PIXI.Assets.add({ alias: name, src: url });
    });

    PIXI.Assets.add({ alias: "casino-bg", src: "/backgrounds/casino.jpg" });

    console.log("Loading assets...");
    await PIXI.Assets.load([...SYMBOLS, "casino-bg"]);
    console.log("Assets loaded successfully.");
  }

  private setup() {
    console.log("Setup started");

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
    const startY = (this.app.renderer.height - symbolSize * totalSymbolsPerReel) / 2;

    for (let i = 0; i < totalReels; i++) {
      const reel = new PIXI.Container();
      reel.x = startX + i * symbolSize;
      reel.y = startY;

      for (let j = 0; j < totalSymbolsPerReel; j++) {
        const symbolName = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const texture = PIXI.Assets.get(symbolName);
        if (!texture || !(texture instanceof PIXI.Texture)) {
          console.warn(`Invalid texture for symbol ${symbolName}`, texture);
          continue;
        }
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

    this.spinTicker.add((ticker: PIXI.Ticker) => this.updateSpin(ticker.deltaMS));
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

    for (let i = 0; i < this.reels.length; i++) {
      const reel = this.reels[i];
      reel.y += this.reelSpeeds[i];

      const centerY = (this.app.renderer.height - reel.height) / 2;

      if (reel.y > centerY + 20) {
        reel.y = centerY;
        reel.children.forEach((child) => {
          const sprite = child as PIXI.Sprite;
          const newSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          const newTexture = PIXI.Assets.get(newSymbol);
          if (newTexture instanceof PIXI.Texture) {
            sprite.texture = newTexture;
          }
        });
      }
    }

    if (
      this.spinTime >= this.spinDuration ||
      this.reelSpeeds.every((speed) => speed <= 0)
    ) {
      this.spinTicker.stop();
      this.spinning = false;

      const centerY = (this.app.renderer.height - this.reels[0].height) / 2;
      this.reels.forEach((reel) => (reel.y = centerY));
    }
  }

  public resize() {
    if (this.background) {
      this.background.width = this.app.renderer.width;
      this.background.height = this.app.renderer.height;
    }

    const symbolSize = this.app.renderer.width / 8;
    const totalReels = 3;
    const totalSymbolsPerReel = 3;
    const reelsWidth = totalReels * symbolSize;
    const startX = (this.app.renderer.width - reelsWidth) / 2;
    const startY = (this.app.renderer.height - symbolSize * totalSymbolsPerReel) / 2;

    this.reels.forEach((reel, i) => {
      reel.x = startX + i * symbolSize;
      reel.y = startY;
      reel.children.forEach((sprite, j) => {
        const s = sprite as PIXI.Sprite;
        s.width = symbolSize;
        s.height = symbolSize;
        s.y = j * symbolSize;
      });
    });

    if (this.spinButton) {
      this.spinButton.x = this.app.renderer.width / 2 - 75;
      this.spinButton.y = this.app.renderer.height - 100;
    }
  }
}
