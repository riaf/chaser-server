export enum CellType {
  FLOOR = 0,
  PLAYER = 1,
  BLOCK = 2,
  ITEM = 3,
}

export enum PlayerType {
  COOL = 'cool',
  HOT = 'hot',
}

export enum Direction {
  UP = 'u',
  RIGHT = 'r',
  LEFT = 'l',
  DOWN = 'd',
}

export enum ActionType {
  WALK = 'w',
  LOOK = 'l',
  SEARCH = 's',
  PUT = 'p',
}

export interface Position {
  x: number
  y: number
}

export interface GameMap {
  name: string
  maxTurns: number
  width: number
  height: number
  cells: CellType[][]
  coolStartPosition: Position
  hotStartPosition: Position
}

export interface Player {
  type: PlayerType
  name: string
  position: Position
  itemCount: number
}

export interface GameState {
  map: GameMap
  coolPlayer: Player
  hotPlayer: Player
  currentTurn: number
  currentPlayer: PlayerType
  isGameOver: boolean
  winner: PlayerType | null
  isDraw: boolean
}

export interface Command {
  action: ActionType
  direction: Direction
}

export interface SurroundingInfo {
  isGameRunning: boolean
  cells: number[]
}

export interface IConnectionHandler {
  start(): Promise<void>
  stop(): Promise<void>
  sendMessage(playerId: string, message: string): Promise<void>
  receiveMessage(playerId: string): Promise<string>
  waitForConnections(): Promise<{ cool: string; hot: string }>
  isConnected(playerId: string): boolean
  disconnect(playerId: string): Promise<void>
}

export interface IGameLogger {
  logGameStart(gameState: GameState): void
  logTurn(turn: number, player: PlayerType, command: Command, gameState: GameState): void
  logGameEnd(gameState: GameState): void
}

export enum GameResult {
  WIN_BY_PUT = 'win_by_put',
  LOSE_BY_WALL_HIT = 'lose_by_wall_hit',
  LOSE_BY_BLOCK_HIT = 'lose_by_block_hit',
  LOSE_BY_SURROUNDED = 'lose_by_surrounded',
  LOSE_BY_DISCONNECT = 'lose_by_disconnect',
  LOSE_BY_INVALID_COMMAND = 'lose_by_invalid_command',
  LOSE_BY_TIMEOUT = 'lose_by_timeout',
  WIN_BY_ITEM_COUNT = 'win_by_item_count',
  DRAW = 'draw',
  DRAW_BY_MUTUAL_PUT = 'draw_by_mutual_put',
}

export interface ActionResult {
  success: boolean
  gameResult?: GameResult
  newPosition?: Position
  itemObtained?: boolean
  lookResult?: CellType[]
  searchResult?: CellType[]
}