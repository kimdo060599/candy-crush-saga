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
  cookies!: Cookie[][];
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
  suffle() {
    var set: Cookie[];

    do {
      set = this.createInitialCookies();
      this.detectPossibleSwaps();
    } while (this.possibleSwaps.length == 0);

    console.log("possibleSwaps", this.possibleSwaps);

    return set;
  }

  private isTwoCookiesEquals(cookieA: Cookie, cookieB: Cookie) {
    return (
      cookieA.column == cookieB.column &&
      cookieA.row == cookieB.row &&
      cookieA.cookieType == cookieB.cookieType
    );
  }

  isPossibleSwap(other: Swap): boolean {
    for (var i = 0; i < this.possibleSwaps.length; i++) {
      var possibleSwap = this.possibleSwaps[i];

      var isPossible =
        (this.isTwoCookiesEquals(other.cookieA, possibleSwap.cookieA) &&
          this.isTwoCookiesEquals(other.cookieB, possibleSwap.cookieB)) ||
        (this.isTwoCookiesEquals(other.cookieB, possibleSwap.cookieA) &&
          this.isTwoCookiesEquals(other.cookieA, possibleSwap.cookieB));

      if (isPossible) return true;
    }

    return false;
  }
  performSwap(swap: Swap) {
    var columnA: number = swap.cookieA.column,
      rowA: number = swap.cookieA.row,
      columnB: number = swap.cookieB.column,
      rowB: number = swap.cookieB.row;

    this.cookies[columnA][rowA] = swap.cookieB;
    swap.cookieB.column = columnA;
    swap.cookieB.row = rowA;

    this.cookies[columnB][rowB] = swap.cookieA;
    swap.cookieA.column = columnB;
    swap.cookieA.row = rowB;
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
  private hasChainAtColumn(column: number, row: number): boolean {
    var cookie = this.cookies[column][row],
      cookieType: CookieType;

    // if (cookie) {
    cookieType = cookie.cookieType;
    // } else {
    //   cookieType = 0;
    // }

    var horzLength = 1;
    for (
      var i = column - 1;
      i >= 0 &&
      this.cookies[i][row] &&
      this.cookies[i][row].cookieType == cookieType;
      i--, horzLength++
    );
    for (
      var i = column + 1;
      i < this.config.numColumns &&
      this.cookies[i][row] &&
      this.cookies[i][row].cookieType == cookieType;
      i++, horzLength++
    );
    if (horzLength >= 3) return true;

    var vertLength = 1;
    for (
      var i = row - 1;
      i >= 0 &&
      this.cookies[column][i] &&
      this.cookies[column][i].cookieType == cookieType;
      i--, vertLength++
    );
    for (
      var i = row + 1;
      i < this.config.numRows &&
      this.cookies[column][i] &&
      this.cookies[column][i].cookieType == cookieType;
      i++, vertLength++
    );
    return vertLength >= 3;
  }
  private detectPossibleSwaps() {
    var possibleSwaps: Swap[] = [];

    for (var row = 0; row < this.config.numRows; row++) {
      for (var column = 0; column < this.config.numColumns; column++) {
        var cookie = this.cookies[column][row];
        if (cookie) {
          // Is it possible to swap this cookie with the one on the right?
          if (column < this.config.numColumns - 1) {
            // Have a cookie in this spot? If there is no tile, there is no cookie.
            var other = this.cookies[column + 1][row];
            if (other) {
              // Swap them
              this.cookies[column][row] = other;
              this.cookies[column + 1][row] = cookie;

              // Is either cookie now part of a chain?
              if (
                this.hasChainAtColumn(column + 1, row) ||
                this.hasChainAtColumn(column, row)
              ) {
                var swap = new Swap();
                swap.cookieA = cookie;
                swap.cookieB = other;
                possibleSwaps.push(swap);
              }

              // Swap them back
              this.cookies[column][row] = cookie;
              this.cookies[column + 1][row] = other;
            }
          }

          if (row < this.config.numRows - 1) {
            var other = this.cookies[column][row + 1];
            if (other) {
              // Swap them
              this.cookies[column][row] = other;
              this.cookies[column][row + 1] = cookie;

              if (
                this.hasChainAtColumn(column, row + 1) ||
                this.hasChainAtColumn(column, row)
              ) {
                var swap = new Swap();
                swap.cookieA = cookie;
                swap.cookieB = other;
                possibleSwaps.push(swap);
              }

              this.cookies[column][row] = cookie;
              this.cookies[column][row + 1] = other;
            }
          }
        }
      }
    }

    this.possibleSwaps = possibleSwaps;
  }
}
