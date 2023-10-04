// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import PreloadBarUpdaterScript from "../script-nodes/PreloadBarUpdaterScript";
/* START-USER-IMPORTS */
import assetPackUrl from "../../static/assets/asset-pack.json";
/* END-USER-IMPORTS */

export default class Preload extends Phaser.Scene {
  constructor() {
    super("Preload");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // progressBar
    const progressBar = this.add.rectangle(252, 568, 256, 20);
    progressBar.setOrigin(0, 0);
    progressBar.isFilled = true;
    progressBar.fillColor = 14737632;

    // preloadUpdater
    new PreloadBarUpdaterScript(progressBar);

    // progressBarBg
    const progressBarBg = this.add.rectangle(252, 568, 256, 20);
    progressBarBg.setOrigin(0, 0);
    progressBarBg.fillColor = 14737632;
    progressBarBg.isStroked = true;

    // loadingText
    const loadingText = this.add.text(252, 538, "", {});
    loadingText.text = "Loading...";
    loadingText.setStyle({
      color: "#e0e0e0",
      fontFamily: "arial",
      fontSize: "20px",
    });

    // diamond
    const diamond = this.add.image(204, 566, "diamond");
    diamond.scaleX = 2;
    diamond.scaleY = 2;

    this.events.emit("scene-awake");
  }

  /* START-USER-CODE */

  // Write your code here

  preload() {
    this.editorCreate();

    this.load.pack("asset-pack", assetPackUrl);
  }

  create() {
    if (process.env.NODE_ENV === "development") {
      const start = new URLSearchParams(location.search).get("start");

      if (start) {
        console.log(`Development: jump to ${start}`);
        this.scene.start(start);

        return;
      }
    }
    const data = {
      levelNumber: 0,
      score: 0,
    };

    this.scene.start("GameScene", data);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
