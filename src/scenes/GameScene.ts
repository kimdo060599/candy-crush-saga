import Phaser from "phaser";
import { Cookie, CookieType, ICookiePosition } from "../models/cookie";
import { GameHelpers } from "../utils/game-helpers";
import { Config } from "../models/config";
import { Tile } from "../models/tile";
import { Level } from "../models/level";
export default class GameScene extends Phaser.Scene {
  tileWidth: number = 64.0;
  tileHeight: number = 72.0;
  marginYDelta: number = 200;
  marginXDelta: number = 32;

  level!: Level;
  cookieLayer!: Phaser.GameObjects.Group;
  tilesLayer!: Phaser.GameObjects.Group;
  swipeFromColumn: number | undefined;
  swipeFromRow: number | undefined;

  isPossibleSwap: boolean = false;
  userInteractionEnabled: any;

  swapSound: any;
  invalidSwapSound: any;
  matchSound: any;
  fallingCookieSound: any;
  addCookieSound: any;

  gameTimer: any;
  config: any;
  score: any;
  levelNumber: number = 0;
  scoreText: any;
  scoreLabel: any;
  screenCenterX!: number;
  constructor() {
    super("GameScene");
  }
  init(data: any) {
    this.score = data.score;
    this.levelNumber = data.levelNumber;
  }
  editorCreate(): void {
    // background_2x
    this.add.image(320, 568, "Background@2x");
    this.events.emit("scene-awake");
  }

  create() {
    this.screenCenterX =
      this.cameras.main.worldView.x + this.cameras.main.width / 2;
    const bgSound = this.sound.add("mining-by-moonlight");
    bgSound.play();
    this.swapSound = this.sound.add("Chomp");
    this.invalidSwapSound = this.sound.add("Error");
    this.matchSound = this.sound.add("Ka-Ching");
    this.fallingCookieSound = this.sound.add("Scrape");
    this.addCookieSound = this.sound.add("Drip");

    this.config = new Config(9, 9, 6);
    // this.level = new Level(this.config);
    this.editorCreate();

    // this.initScore();
    this.createScoreText();

    this.createLevelText(this.levelNumber + 1);

    this.initLevel("Level_" + this.levelNumber);
    this.beginGame();
  }

  //   private initScore() {
  //     var scoreFromState = this.game.state.states['GameScene'].score;
  //     if(scoreFromState != null){
  //        this.score =  scoreFromState;
  //     }
  //     else{
  //        this.score =  0;
  //     }
  //  }

  beginGame() {
    var cookies: Cookie[] = this.level.createInitialCookies();
    this.addSpritesForCookies(cookies);
  }

  private createScoreText() {
    this.scoreLabel = this.add.text(this.screenCenterX, 20, "Score:", {
      // font: "Gill Sans Bold",
      fontSize: 20,
    });
    this.scoreLabel.setShadow(-1, 1, "rgba(0,0,0,0.5)", 0);

    this.scoreText = this.add.text(this.screenCenterX, 40, "" + this.score, {
      // font: "Gill Sans Bold",
      fontSize: 30,
    });
    this.scoreText.setShadow(-1, 1, "rgba(0,0,0,0.5)", 0);
  }

  private createLevelText(levelNumber: number) {
    var levelLabel = this.add.text(550, 20, "Level:", {
      // font: "Quicksand",
      align: "center",
      fontSize: 20,
    });
    levelLabel.setShadow(-1, 1, "rgba(0,0,0,0.5)", 0);

    var levelText = this.add.text(550, 40, "" + levelNumber, {
      // font: "Gill Sans Bold",
      align: "center",
      fontSize: 30,
    });
    levelText.setShadow(-1, 1, "rgba(0,0,0,0.5)", 0);
  }

  private initLevel(levelName: string) {
    var levelData = this.cache.json.get(levelName);

    if (levelData == null) {
      throw "Cannot load level data";
    }

    // var gameConfig = new Config(9, 9, 6);
    this.level = new Level(this.config);
    this.level.initWithData(levelData);
    this.addTiles();
  }

  addSpritesForCookies(cookies: Cookie[]) {
    this.cookieLayer = this.add.group();
    this.cookieLayer.setDepth(2);

    cookies.forEach((cookie: Cookie) => {
      var point = this.pointForCookie(cookie.column, cookie.row);
      var createdCookie: Phaser.GameObjects.Sprite = this.cookieLayer.create(
        point.x,
        point.y,
        cookie.spriteName()
      );
      createdCookie.setInteractive();
      createdCookie.on("pointerdown", () => {
        this.touchesBegan(createdCookie, point);
      });
      createdCookie.on("pointerup", this.touchesEnd);
      cookie.sprite = createdCookie;
      // console.log(createdCookie.event);
      // debugger;
    });
  }

  touchesBegan(
    selectedCookie: Phaser.GameObjects.Sprite,
    point: Phaser.Geom.Point
  ) {
    var cookiePosition: ICookiePosition = {
      column: null!,
      row: null!,
    };
    var selectedCookiePosition = new Phaser.Geom.Point(
      selectedCookie.x,
      selectedCookie.y
    );
    if (this.convertPoint(selectedCookiePosition, cookiePosition)) {
      if (
        this.level.cookieAtPosition(cookiePosition.column, cookiePosition.row)
      ) {
        this.swipeFromColumn = cookiePosition.column;
        this.swipeFromRow = cookiePosition.row;
      }

      console.log(
        "selectedCookie",
        "column: " + cookiePosition.column + " row: " + cookiePosition.row
      );
    } else {
      this.swipeFromColumn = undefined;
      this.swipeFromRow = undefined;
    }
  }

  convertPoint(
    point: Phaser.Geom.Point,
    cookiePosition: ICookiePosition
  ): boolean {
    var x = point.x - 32 - this.marginXDelta;
    var y = point.y - 32 - this.marginYDelta;
    if (
      x >= 0 &&
      x < this.level.config.numColumns * this.tileWidth &&
      y >= 0 &&
      y < this.level.config.numRows * this.tileHeight
    ) {
      cookiePosition.column = Phaser.Math.FloorTo(x / this.tileWidth);
      cookiePosition.row = Phaser.Math.FloorTo(y / this.tileHeight);

      return true;
    } else {
      return false;
    }
  }
  touchesEnd() {
    console.log("this.touchesEnd");
  }

  addTiles() {
    this.tilesLayer = this.add.group();
    this.tilesLayer.setDepth(1);

    for (var row: number = 0; row < this.config.numColumns; row++) {
      for (var column: number = 0; column < this.config.numColumns; column++) {
        // if (this.level.tileAtColumn(column, row) != null) {
        var point = this.pointForCookie(column, row);
        this.tilesLayer.create(point.x, point.y, "Tile@2x");
        // }
      }
    }
  }

  pointForCookie(column: number, row: number): Phaser.Geom.Point {
    var x = column * this.tileWidth + this.tileWidth / 2 + this.marginXDelta;
    var y = row * this.tileHeight + this.tileHeight / 2 + this.marginYDelta;

    return new Phaser.Geom.Point(x, y);
  }
}
