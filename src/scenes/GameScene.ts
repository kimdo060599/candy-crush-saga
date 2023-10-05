import Phaser from "phaser";
import { Cookie, CookieType } from "../models/cookie";
import { GameHelpers } from "../utils/game-helpers";
import { Config } from "../models/config";
import { Tile } from "../models/tile";
export default class GameScene extends Phaser.Scene {
  tileWidth: number = 64.0;
  tileHeight: number = 72.0;
  marginYDelta: number = 50;

  level: any;
  cookies: any;
  tiles: any;
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
    var cookies: Cookie[] = this.createInitialCookies();
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

    // var gameConfig = new GameConfig(9, 9, 6);
    // this.level = new Level(gameConfig);
    // this.level.initWithData(levelData);
    this.initWithData(levelData);
    this.addTiles();
  }
  initWithData(level: any) {
    this.createTilesArray();

    for (var row: number = 0; row < this.config.numRows; row++) {
      for (var column: number = 0; column < this.config.numColumns; column++) {
        var tile = level.tiles[column][row];

        if (tile == 1) {
          this.tiles[column][row] = new Tile();
        } else {
          this.tiles[column][row] = null;
        }
      }
    }
  }
  private createTilesArray() {
    this.tiles = new Array(this.config.numColumns - 1);
    for (var i = 0; i < this.config.numColumns; i++) {
      this.tiles[i] = new Array(this.config.numRows - 1);
    }
  }
  addSpritesForCookies(cookies: Cookie[]) {
    this.cookieLayer = this.add.group();
    this.cookieLayer.z = 2;

    cookies.forEach((cookie: Cookie) => {
      var point = this.pointForCookie(cookie.column, cookie.row);
      var createdCookie = this.cookieLayer.create(
        point.x,
        point.y,
        cookie.spriteName()
      );
      createdCookie.inputEnabled = true;
      //  createdCookie.events.onInputDown.add(this.touchesBegan, this);
      //  createdCookie.events.onInputUp.add(this.touchesEnd, this);
      cookie.sprite = createdCookie;
    });
  }
  addTiles() {
    this.tilesLayer = this.add.group();
    this.tilesLayer.z = 1;

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
    var x = column * this.tileWidth + this.tileWidth / 2;
    var y = row * this.tileHeight + this.tileHeight / 2 + this.marginYDelta;

    return new Phaser.Geom.Point(x, y);
  }

  createInitialCookies(): Array<Cookie> {
    var array: Cookie[] = [];
    for (var row: number = 0; row < this.config.numRows; row++) {
      for (var column: number = 0; column < this.config.numColumns; column++) {
        if (this.tiles[column][row] != null) {
          var cookieType: CookieType = this.calculateCookieType(column, row);
          var cookie: Cookie = this.createCookieAtColumn(
            column,
            row,
            cookieType
          );
          array.push(cookie);
        } else {
          this.cookies[column][row] = undefined;
        }
      }
    }

    return array;
  }
  private calculateCookieType(column: number, row: number): CookieType {
    var cookieType: CookieType;

    // do {
    cookieType = GameHelpers.getRandomNumber(this.config.numCookieTypes);
    // } while (this.whereIsAlreadyTwoCookies(column, row, cookieType));

    return cookieType;
  }
  private createCookieAtColumn(
    column: number,
    row: number,
    cookieType: CookieType
  ): Cookie {
    var cookie = new Cookie(column, row, cookieType);
    console.log(this.cookies);

    // this.cookies[column][row] = cookie;
    return cookie;
  }
  private whereIsAlreadyTwoCookies(
    column: number,
    row: number,
    cookieType: CookieType
  ): boolean {
    return (
      (column >= 2 &&
        this.cookies[column - 1][row] &&
        this.cookies[column - 2][row] &&
        this.cookies[column - 1][row].cookieType == cookieType &&
        this.cookies[column - 2][row].cookieType == cookieType) ||
      (row >= 2 &&
        this.cookies[column][row - 1] &&
        this.cookies[column][row - 2] &&
        this.cookies[column][row - 1].cookieType == cookieType &&
        this.cookies[column][row - 2].cookieType == cookieType)
    );
  }
}
