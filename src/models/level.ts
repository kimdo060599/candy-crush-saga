import { GameHelpers } from "../utils/game-helpers";
import { Config } from "./config";
import { Cookie, CookieType } from "./cookie";
import { Swap } from "./swap";
import { Tile } from "./tile";

export interface ILevel {
  tiles: Tile[][];
  targetScore: number;
  moves: number;
}
export class Level {
  cookies!: Cookie [][];
  tiles!: (Tile | undefined)[][];
  possibleSwaps!: Swap[];

  config: Config;

  constructor(gameConfig: Config) {
    this.config = gameConfig;
    this.createCookiesArray();
  }

  createCookiesArray() {
    this.cookies = new Array(this.config.numColumns - 1);
    for (var i = 0; i < this.config.numColumns; i++) {
      this.cookies[i] = new Array(this.config.numRows - 1);
    }
  }

  initWithData(level: any) {
    this.createTilesArray();

    for (var row: number = 0; row < this.config.numRows; row++) {
      for (var column: number = 0; column < this.config.numColumns; column++) {
        var tile = level.tiles[column][row];

        if (tile == 1) {
          this.tiles[column][row] = new Tile();
        } else {
          this.tiles[column][row] = undefined;
        }
      }
    }
  }

  private isTwoCookiesEquals(cookieA: Cookie, cookieB: Cookie) {
    return cookieA.column == cookieB.column && cookieA.row == cookieB.row && cookieA.cookieType == cookieB.cookieType;
  }

  isPossibleSwap(other: Swap): boolean {

    for (var i = 0; i < this.possibleSwaps.length; i++) {
      var possibleSwap = this.possibleSwaps[i];

      var isPossible = (this.isTwoCookiesEquals(other.cookieA, possibleSwap.cookieA) && this.isTwoCookiesEquals(other.cookieB, possibleSwap.cookieB)) ||
        (this.isTwoCookiesEquals(other.cookieB, possibleSwap.cookieA) && this.isTwoCookiesEquals(other.cookieA, possibleSwap.cookieB));

      if (isPossible) return true;
    }

    return false;
  }

  private createTilesArray() {
    this.tiles = new Array(this.config.numColumns - 1);
    for (var i = 0; i < this.config.numColumns; i++) {
      this.tiles[i] = new Array(this.config.numRows - 1);
    }
  }

  createInitialCookies(): Array<Cookie> {
    var array: Cookie[] = [];
    for (var row: number = 0; row < this.config.numRows; row++) {
      for (var column: number = 0; column < this.config.numColumns; column++) {
        if (this.tiles[column][row] != undefined) {
          var cookieType: CookieType = this.calculateCookieType(column, row);
          var cookie: Cookie = this.createCookieAtColumn(
            column,
            row,
            cookieType
          );
          array.push(cookie);
        } else {
          this.cookies[column][row] = null!;
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
    this.cookies[column][row] = cookie;
    return cookie;
  }

  cookieAtPosition(column: number, row: number) {
    return this.cookies[column][row];
  }
}
