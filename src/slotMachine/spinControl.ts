import * as PIXI from "pixi.js";
import { updateReelsSpin, alignReelsSymbols } from "./reels";

export class SpinControl {
  private reels: PIXI.Container[];
  private reelSpeeds: number[];
  private reelBaseSpeeds: number[];
  private spinDuration: number;
  private decelerationStartTime: number;
  private spinTime: number;
  private spinning: boolean = false;
  private spinTicker: PIXI.Ticker;

  constructor(reels: PIXI.Container[]) {
    this.reels = reels;
    this.reelBaseSpeeds = [1.5, 1.0, 0.7];
    this.reelSpeeds = [...this.reelBaseSpeeds];
    this.spinDuration = 3000;
    this.decelerationStartTime = 2000;
    this.spinTime = 0;

    this.spinTicker = new PIXI.Ticker();
    this.spinTicker.stop();

    this.spinTicker.add((ticker) => {
      this.updateSpin(ticker.deltaMS);
    });
  }

  startSpin() {
    if (this.spinning) return;
    this.spinning = true;
    this.spinTime = 0;
    this.reelSpeeds = [...this.reelBaseSpeeds];
    this.spinTicker.start();
  }

  updateSpin(deltaMS: number) {
    this.spinTime += deltaMS;

    if (this.spinTime >= this.decelerationStartTime) {
      const elapsed = this.spinTime - this.decelerationStartTime;
      const duration = this.spinDuration - this.decelerationStartTime;
      for (let i = 0; i < this.reelSpeeds.length; i++) {
        const newSpeed =
          this.reelBaseSpeeds[i] * (1 - elapsed / duration);
        this.reelSpeeds[i] = Math.max(newSpeed, 0);
      }
    }

    const symbolSize = this.reels[0].children[0]?.width || 0;
    const totalSymbolsPerReel = this.reels[0].children.length;

    updateReelsSpin(this.reels, this.reelSpeeds, symbolSize, totalSymbolsPerReel);

    if (
      this.spinTime >= this.spinDuration &&
      this.reelSpeeds.every((s) => s <= 0.01)
    ) {
      this.spinTicker.stop();
      this.spinning = false;
      alignReelsSymbols(this.reels, symbolSize);
      this.onSpinComplete?.();
    }
  }

  public onSpinComplete?: () => void;

  isSpinning() {
    return this.spinning;
  }

  stop() {
    this.spinTicker.stop();
    this.spinning = false;
  }
}
