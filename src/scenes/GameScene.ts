import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  tileWidth: number = 64.0;
  tileHeight: number = 72.0;
  marginYDelta: number = 50;

  level: any;

  cookieLayer: any;
  tilesLayer: any;

  swipeFromColumn: any;
  swipeFromRow: any;

  isPossibleSwap: boolean = false;
  userInteractionEnabled: any;

  swapSound: any;
  invalidSwapSound: any;
  matchSound: any;
  fallingCookieSound: any;
  addCookieSound: any;

  gameTimer: any;

  score: any;
  scoreText: any;
  scoreLabel: any;
  constructor() {
    super("GameScene");
  }

  editorCreate(): void {
    // background_2x
    this.add.image(320, 568, "Background@2x");

    // timerText
    const timerText = this.add.text(32, 20, "", {});
    timerText.text = "Time";
    timerText.setStyle({ fontSize: "20px" });

    // levelText
    const levelText = this.add.text(244, 20, "", {});
    levelText.text = "Level";
    levelText.setStyle({ fontSize: "20px" });

    // scoreText
    const scoreText = this.add.text(429, 20, "", {});
    scoreText.text = "Score";
    scoreText.setStyle({ fontSize: "20px" });

    this.events.emit("scene-awake");
  }

  create() {
    var levelNumber: number = 0;
    const screenCenterX =
      this.cameras.main.worldView.x + this.cameras.main.width / 2;
    console.log("screenCenterX", screenCenterX);
    const bgSound = this.sound.add("mining-by-moonlight");
    bgSound.play();
    this.swapSound = this.sound.add("Chomp");
    this.invalidSwapSound = this.sound.add("Error");
    this.matchSound = this.sound.add("Ka-Ching");
    this.fallingCookieSound = this.sound.add("Scrape");
    this.addCookieSound = this.sound.add("Drip");

    this.editorCreate();
    this.createLevelText(levelNumber + 1);
  }
  private createLevelText(levelNumber: number) {
    var levelLabel = this.add.text(550, 20, "Level:", {
      font: "Gill Sans Bold",
      align: "center",
      fontSize: 20,
    });
    levelLabel.setShadow(-1, 1, "rgba(0,0,0,0.5)", 0);

    var levelText = this.add.text(550, 40, "" + levelNumber, {
      font: "Gill Sans Bold",
      align: "center",
      fontSize: 30,
    });
    levelText.setShadow(-1, 1, "rgba(0,0,0,0.5)", 0);
  }
}
