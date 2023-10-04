import Phaser from "phaser";
import Level from "./scenes/Level";
import preloadAssetPackUrl from "../static/assets/preload-asset-pack.json";
import Preload from "./scenes/Preload";
import GameScene from "./scenes/GameScene";

class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.pack("pack", preloadAssetPackUrl);
  }

  create() {
    this.scene.start("Preload");
  }
}

window.addEventListener("load", function () {
  const game = new Phaser.Game({
    width: 640,
    height: 1136,
    backgroundColor: "#2f2f2f",
    scale: {
      mode: Phaser.Scale.ScaleModes.FIT,
      autoCenter: Phaser.Scale.Center.CENTER_BOTH,
    },
    scene: [Boot, Preload, GameScene],
  });

  game.scene.start("Boot");
});
