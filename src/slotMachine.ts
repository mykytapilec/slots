import * as PIXI from "pixi.js";

const SYMBOLS = ["armor", "forest", "goblin", "milk"];

export class SlotMachine {
  private app: PIXI.Application;
  private reels: PIXI.Container[] = [];

  constructor(app: PIXI.Application) {
    this.app = app;
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

    console.log("Loading assets...");
    await PIXI.Assets.load(SYMBOLS);
    console.log("Assets loaded successfully.");
  }

  private setup() {
    console.log("Setup started");
    const symbolSize = 150;

    for (let i = 0; i < 3; i++) {
      const reel = new PIXI.Container();
      reel.x = i * symbolSize + 100;
      reel.y = 100;

      for (let j = 0; j < 3; j++) {
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

    const spinButton = this.createButton("SPIN", 300, 500, () => this.spin());
    this.app.stage.addChild(spinButton);
  }

  private createButton(text: string, x: number, y: number, onClick: () => void): PIXI.Container {
    const button = new PIXI.Container();
    button.interactive = true;
    button.cursor = "pointer";

    const graphics = new PIXI.Graphics();
    graphics.beginFill(0x333333);
    graphics.drawRoundedRect(0, 0, 150, 50, 10);
    graphics.endFill();
    button.addChild(graphics);

    const buttonText = new PIXI.Text(text, { fill: "white", fontSize: 24 });
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
    for (const reel of this.reels) {
      for (const child of reel.children) {
        const sprite = child as PIXI.Sprite;
        const newSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        const newTexture = PIXI.Assets.get(newSymbol);
        if (newTexture instanceof PIXI.Texture) {
          sprite.texture = newTexture;
        }
      }
    }
  }
}
