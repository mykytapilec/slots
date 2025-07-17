import * as PIXI from "pixi.js";

export function createButton(
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

export function highlightSymbol(
  symbol: PIXI.Sprite,
  color: number,
  alpha: number,
  container: PIXI.Container
) {
  const highlight = new PIXI.Graphics();
  highlight.beginFill(color, alpha);
  highlight.drawRect(0, 0, symbol.width, symbol.height);
  highlight.endFill();

  highlight.x = symbol.x;
  highlight.y = symbol.y;

  container.addChild(highlight);
  return highlight;
}
