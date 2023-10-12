import Phaser from "phaser";
import { Cookie, CookieType, ICookiePosition } from "../models/cookie";
import { GameHelpers } from "../utils/game-helpers";
import { Config } from "../models/config";
import { Tile } from "../models/tile";
import { Level } from "../models/level";
import { Swap } from "../models/swap";
import { Chain } from "../models/chain";
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
  userInteractionEnabled: boolean = true;

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
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.touchesMoved(pointer, pointer.x, pointer.y);
    });
    this.input.on("pointerup", () => {
      this.touchesEnd();
    });
    this.initLevel("Level_" + this.levelNumber);
    this.beginGame();
  }

  update(time: number, delta: number): void {
    this.handleInteractive();
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
    this.userInteractionEnabled = true;
    this.shuffle();
  }

  shuffle() {
    var cookies: Cookie[] = this.level.suffle();
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

      createdCookie.on(
        Phaser.Input.Events.GAMEOBJECT_POINTER_UP,
        (pointer: Phaser.Input.Pointer) => {
          // this.touchesEnd();
        }
      );
      cookie.sprite = createdCookie;
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
    } else {
      this.swipeFromColumn = undefined;
      this.swipeFromRow = undefined;
    }
  }

  touchesMoved(pointer: Phaser.Input.Pointer, x: number, y: number) {
    // this.debugMove(x, y);
    if (this.swipeFromColumn == undefined) return;

    if (pointer.isDown) {
      var cookiePosition: ICookiePosition = {
        column: null!,
        row: null!,
      };
      //TODO: need to configure this sizes

      if (this.convertPoint(new Phaser.Geom.Point(x, y), cookiePosition)) {
        var horzDelta: number = 0,
          vertDelta: number = 0;

        if (cookiePosition.column < this.swipeFromColumn) {
          // swipe left
          horzDelta = -1;
        } else if (cookiePosition.column > this.swipeFromColumn) {
          // swipe right
          horzDelta = 1;
        } else if (cookiePosition.row < this.swipeFromRow!) {
          // swipe down
          vertDelta = -1;
        } else if (cookiePosition.row > this.swipeFromRow!) {
          // swipe up
          vertDelta = 1;
        }

        if (horzDelta != 0 || vertDelta != 0) {
          this.trySwapHorizontal(horzDelta, vertDelta);
          this.swipeFromColumn = undefined;
        }
      }
    }
  }

  trySwapHorizontal(horzDelta: number, vertDelta: number) {
    this.userInteractionEnabled = false;

    var toColumn = this.swipeFromColumn! + horzDelta;
    var toRow = this.swipeFromRow! + vertDelta;
    // console.log(
    //   "From: ",
    //   this.swipeFromColumn,
    //   this.swipeFromRow,
    //   " To: ",
    //   toColumn,
    //   toRow
    // );
    if (toColumn < 0 || toColumn >= this.level.config.numColumns) return;
    if (toRow < 0 || toRow >= this.level.config.numRows) return;

    var toCookie: Cookie | undefined = this.level.cookieAtPosition(
      toColumn,
      toRow
    );
    if (!toCookie) return;

    var fromCookie = this.level.cookieAtPosition(
      this.swipeFromColumn!,
      this.swipeFromRow!
    );
    if (!fromCookie) return;
    var swap = new Swap();
    swap.cookieA = fromCookie;
    swap.cookieB = toCookie;

    if (this.level.isPossibleSwap(swap)) {
      this.level.performSwap(swap);
      this.animateSwap(swap);
      this.isPossibleSwap = true;
    } else {
      this.animateInvalidSwap(swap);
      this.isPossibleSwap = false;
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
      cookiePosition.column = Phaser.Math.RoundTo(x / this.tileWidth);
      cookiePosition.row = Phaser.Math.RoundTo(y / this.tileHeight);
      return true;
    } else {
      return false;
    }
  }

  touchesEnd() {
    this.swipeFromColumn = this.swipeFromRow = undefined;
    if (this.isPossibleSwap) {
      this.userInteractionEnabled = false;
      this.handleMatches();
    }
    // debugger;
    // this.userInteractionEnabled = true;
  }

  handleMatches() {
    var chains = this.level.removeMatches();

    if (chains.length == 0) {
      this.beginNextTurn();
      return;
    }
    this.animateMatchedCookies(chains);
    var columns = this.level.fillHolesFromTopToBottom();
    this.animateFallingCookies(columns);
    var newColumns = this.level.topUpCookies();
    this.animateNewCookies(newColumns, () => {
      this.handleMatches();
    });
  }

  private beginNextTurn() {
    this.userInteractionEnabled = true;
  }

  handleInteractive() {
    this.cookieLayer.getChildren().forEach((child) => {
      this.userInteractionEnabled
        ? child.setInteractive()
        : child.disableInteractive();
    });
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

  animateSwap(swap: Swap) {
    var cookieSrpiteA: Phaser.GameObjects.Sprite | undefined =
        swap.cookieA.sprite,
      cookieSrpiteB: Phaser.GameObjects.Sprite | undefined =
        swap.cookieB.sprite;
    if (!cookieSrpiteA || !cookieSrpiteB) return;

    var tween = this.add.tween({
      targets: swap.cookieA.sprite,
      duration: 100,
      ease: Phaser.Math.Easing.Linear,
      x: cookieSrpiteB.x,
      y: cookieSrpiteB.y,
      onComplete: () => {
        this.swapSound.play();
      },
    });
    var tween2 = this.add.tween({
      targets: swap.cookieB.sprite,
      duration: 100,
      ease: Phaser.Math.Easing.Linear,
      x: cookieSrpiteA.x,
      y: cookieSrpiteA.y,
    });
  }

  animateInvalidSwap(swap: Swap) {
    var cookieSrpiteA: Phaser.GameObjects.Sprite | undefined =
        swap.cookieA.sprite,
      cookieSrpiteB: Phaser.GameObjects.Sprite | undefined =
        swap.cookieB.sprite;
    if (!cookieSrpiteA || !cookieSrpiteB) return;
    var tween = this.add.tween({
      targets: swap.cookieA.sprite,
      duration: 100,
      ease: Phaser.Math.Easing.Linear,
      x: cookieSrpiteB.x,
      y: cookieSrpiteB.y,
    });
    var tween2 = this.add.tween({
      targets: swap.cookieB.sprite,
      duration: 100,
      ease: Phaser.Math.Easing.Linear,
      x: cookieSrpiteA.x,
      y: cookieSrpiteA.y,
      onComplete: () => {
        if (!cookieSrpiteA || !cookieSrpiteB) return;

        var tweenBack = this.add.tween({
          targets: swap.cookieB.sprite,
          duration: 100,
          x: cookieSrpiteA.x,
          y: cookieSrpiteA.y,
        });
        var tweenBack2 = this.add.tween({
          targets: swap.cookieA.sprite,
          duration: 100,
          x: cookieSrpiteB.x,
          y: cookieSrpiteB.y,
          onComplete: () => {
            this.userInteractionEnabled = true;
          },
        });
        this.invalidSwapSound.play();
      },
    });
  }

  animateMatchedCookies(chains: Chain[]) {
    chains.forEach((chain) => {
      //  this.animateScoreForChain(chain);

      chain.cookies.forEach((cookie) => {
        // 1
        if (cookie.sprite != undefined) {
          // 2
          cookie.sprite.destroy();
          this.matchSound.play();

          // 3
          cookie.sprite = undefined;
        }
      });
    });
  }

  animateFallingCookies(columns: any[]) {
    var longestDuration = 0;
    columns.forEach((cookies: Cookie[]) => {
      var count = 0;
      cookies.forEach((cookie: Cookie) => {
        count++;

        var newPosition = this.pointForCookie(cookie.column, cookie.row);

        var delay = 0.05 + 0.15 * count * 500;

        var duration =
          ((cookie.sprite!.y - newPosition.y) / this.tileHeight) * 100;

        longestDuration = Math.max(longestDuration, duration + delay);
        var tween = this.add.tween({
          targets: cookie.sprite,
          delay: delay,
          duration: duration,
          ease: Phaser.Math.Easing.Linear,
          x: newPosition.x,
          y: newPosition.y,
          onComplete: () => {
            this.fallingCookieSound.play();
          },
        });
      });
    });
  }

  animateNewCookies(columns: any[], onComplete: Function) {
    var longestDuration = 0;
    var tweens: Phaser.Tweens.Tween[] = [];
    columns.forEach((cookies: Cookie[]) => {
      var idx = 0;
      var cookiesCount = cookies.length;

      cookies.forEach((cookie: Cookie) => {
        idx++;
        var startRow = cookie.row + 1;

        var point = this.pointForCookie(cookie.column, startRow);
        var createdCookie: Phaser.GameObjects.Sprite = this.cookieLayer.create(
          point.x,
          point.y,
          cookie.spriteName()
        );
        createdCookie.setInteractive();
        createdCookie.on("pointerdown", () => {
          this.touchesBegan(createdCookie, point);
        });
        createdCookie.on("pointerup", () => {
          this.touchesEnd();
        });
        cookie.sprite = createdCookie;
        var delay = 0.1 + 0.2 * (cookiesCount - idx - 1) * 150;

        var newPoint = this.pointForCookie(cookie.column, cookie.row);
        var duration =
          ((cookie.sprite!.y - newPoint.y) / this.tileHeight) *
          cookie.row *
          100;

        longestDuration = Math.max(longestDuration, duration + delay);
        createdCookie.alpha = 0;
        var tween = this.add.tween({
          targets: createdCookie,
          duration: duration,
          ease: Phaser.Math.Easing.Linear,
          x: newPoint.x,
          y: newPoint.y,
          alpha: 1,
        });
      });
    });
    this.time.addEvent({
      delay: longestDuration + 100,
      callback: onComplete,
    });
  }
}
