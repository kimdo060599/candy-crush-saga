// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import OnPointerDownScript from "../script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../script-nodes/PushActionScript";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Level extends Phaser.Scene {
  constructor() {
    super("Level");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // fufuSuperDino
    const fufuSuperDino = this.add.image(320, 568, "FufuSuperDino");

    // onPointerDownScript
    const onPointerDownScript = new OnPointerDownScript(fufuSuperDino);

    // pushAction
    new PushActionScript(onPointerDownScript);

    // text
    const text = this.add.text(316, 647, "", {});
    text.setOrigin(0.5, 0.5);
    text.text = "HI\n";
    text.setStyle({ align: "center", fontFamily: "Arial", fontSize: "3em" });

    this.events.emit("scene-awake");
  }

  /* START-USER-CODE */

  // Write your code here

  create() {
    this.editorCreate();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
