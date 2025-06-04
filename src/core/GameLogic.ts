import { GameState, Command, ActionResult, Position, PlayerType, CellType, ActionType, Direction, GameResult } from '../types'
import { MapManager } from './MapManager'

export class GameLogic {
  private mapManager = new MapManager()

  public createGameFromMapString(mapString: string): GameState {
    const gameMap = this.mapManager.loadMapFromString(mapString)
    
    return {
      map: gameMap,
      coolPlayer: {
        type: PlayerType.COOL,
        name: '',
        position: { ...gameMap.coolStartPosition },
        itemCount: 0,
      },
      hotPlayer: {
        type: PlayerType.HOT,
        name: '',
        position: { ...gameMap.hotStartPosition },
        itemCount: 0,
      },
      currentTurn: 1,
      currentPlayer: PlayerType.COOL,
      isGameOver: false,
      winner: null,
      isDraw: false,
    }
  }

  public executeAction(gameState: GameState, command: Command): ActionResult {
    const currentPlayer = gameState.currentPlayer === PlayerType.COOL 
      ? gameState.coolPlayer 
      : gameState.hotPlayer
    
    switch (command.action) {
      case ActionType.WALK:
        return this.executeWalk(gameState, currentPlayer, command.direction)
      case ActionType.PUT:
        return this.executePut(gameState, currentPlayer, command.direction)
      case ActionType.LOOK:
        return this.executeLook(gameState, currentPlayer, command.direction)
      case ActionType.SEARCH:
        return this.executeSearch(gameState, currentPlayer, command.direction)
      default:
        return { success: false, gameResult: GameResult.LOSE_BY_INVALID_COMMAND }
    }
  }

  private executeWalk(gameState: GameState, player: any, direction: Direction): ActionResult {
    const newPosition = this.getPositionInDirection(player.position, direction)
    
    // Check bounds
    if (this.isOutOfBounds(gameState, newPosition)) {
      return { success: false, gameResult: GameResult.LOSE_BY_WALL_HIT }
    }
    
    const cellType = gameState.map.cells[newPosition.y][newPosition.x]
    
    // Check if target is block
    if (cellType === CellType.BLOCK) {
      return { success: false, gameResult: GameResult.LOSE_BY_BLOCK_HIT }
    }
    
    // Check if target has opponent
    const opponent = player.type === PlayerType.COOL ? gameState.hotPlayer : gameState.coolPlayer
    if (opponent.position.x === newPosition.x && opponent.position.y === newPosition.y) {
      return { success: false, gameResult: GameResult.LOSE_BY_WALL_HIT }
    }
    
    const oldPosition = { ...player.position }
    let itemObtained = false
    
    // Update player position first
    player.position = newPosition
    
    // Check if stepping on item
    if (cellType === CellType.ITEM) {
      itemObtained = true
      player.itemCount++
      gameState.map.cells[newPosition.y][newPosition.x] = CellType.FLOOR
      // Place block at previous position
      gameState.map.cells[oldPosition.y][oldPosition.x] = CellType.BLOCK
      
      // Check if placing block surrounds opponent
      if (this.checkSurrounded(gameState, opponent.position)) {
        gameState.isGameOver = true
        gameState.winner = player.type
        return { 
          success: true, 
          newPosition, 
          itemObtained, 
          gameResult: GameResult.WIN_BY_PUT 
        }
      }
    }
    
    return { success: true, newPosition, itemObtained }
  }

  private executePut(gameState: GameState, player: any, direction: Direction): ActionResult {
    const targetPosition = this.getPositionInDirection(player.position, direction)
    
    // Check bounds
    if (this.isOutOfBounds(gameState, targetPosition)) {
      return { success: false }
    }
    
    const cellType = gameState.map.cells[targetPosition.y][targetPosition.x]
    
    // Cannot place block on existing block or item
    if (cellType === CellType.BLOCK || cellType === CellType.ITEM) {
      return { success: false }
    }
    
    // Check if target has opponent
    const opponent = player.type === PlayerType.COOL ? gameState.hotPlayer : gameState.coolPlayer
    if (opponent.position.x === targetPosition.x && opponent.position.y === targetPosition.y) {
      gameState.isGameOver = true
      gameState.winner = player.type
      return { success: true, gameResult: GameResult.WIN_BY_PUT }
    }
    
    // Place block
    gameState.map.cells[targetPosition.y][targetPosition.x] = CellType.BLOCK
    
    // Check if this surrounds the current player (draw condition)
    if (this.checkSurrounded(gameState, player.position)) {
      gameState.isGameOver = true
      gameState.isDraw = true
      return { success: true, gameResult: GameResult.DRAW_BY_MUTUAL_PUT }
    }
    
    // Check if this surrounds the opponent
    if (this.checkSurrounded(gameState, opponent.position)) {
      gameState.isGameOver = true
      gameState.winner = player.type
      return { success: true, gameResult: GameResult.WIN_BY_PUT }
    }
    
    return { success: true }
  }

  private executeLook(gameState: GameState, player: any, direction: Direction): ActionResult {
    const targetPosition = this.getPositionInDirection(player.position, direction)
    const lookResult: CellType[] = []
    
    // Get 3x3 area around target position
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const checkPosition = {
          x: targetPosition.x + dx,
          y: targetPosition.y + dy
        }
        
        if (this.isOutOfBounds(gameState, checkPosition)) {
          lookResult.push(CellType.BLOCK)
        } else {
          // Check for players
          const opponent = player.type === PlayerType.COOL ? gameState.hotPlayer : gameState.coolPlayer
          if ((player.position.x === checkPosition.x && player.position.y === checkPosition.y) ||
              (opponent.position.x === checkPosition.x && opponent.position.y === checkPosition.y)) {
            lookResult.push(CellType.PLAYER)
          } else {
            lookResult.push(gameState.map.cells[checkPosition.y][checkPosition.x])
          }
        }
      }
    }
    
    return { success: true, lookResult }
  }

  private executeSearch(gameState: GameState, player: any, direction: Direction): ActionResult {
    const searchResult: CellType[] = []
    
    // Get 9 cells in straight line in the specified direction
    for (let i = 1; i <= 9; i++) {
      const checkPosition = this.getPositionInDirection(player.position, direction, i)
      
      if (this.isOutOfBounds(gameState, checkPosition)) {
        searchResult.push(CellType.BLOCK)
      } else {
        // Check for players
        const opponent = player.type === PlayerType.COOL ? gameState.hotPlayer : gameState.coolPlayer
        if (opponent.position.x === checkPosition.x && opponent.position.y === checkPosition.y) {
          searchResult.push(CellType.PLAYER)
        } else {
          searchResult.push(gameState.map.cells[checkPosition.y][checkPosition.x])
        }
      }
    }
    
    return { success: true, searchResult }
  }

  public checkSurrounded(gameState: GameState, position: Position): boolean {
    const directions = [
      { dx: 0, dy: -1 }, // up
      { dx: 1, dy: 0 },  // right
      { dx: 0, dy: 1 },  // down
      { dx: -1, dy: 0 }  // left
    ]
    
    for (const dir of directions) {
      const checkPosition = {
        x: position.x + dir.dx,
        y: position.y + dir.dy
      }
      
      // If out of bounds, consider it blocked
      if (this.isOutOfBounds(gameState, checkPosition)) {
        continue
      }
      
      const cellType = gameState.map.cells[checkPosition.y][checkPosition.x]
      
      // If there's a free space, not surrounded
      if (cellType === CellType.FLOOR || cellType === CellType.ITEM) {
        return false
      }
    }
    
    return true
  }

  public checkGameEnd(gameState: GameState): void {
    if (gameState.currentTurn >= gameState.map.maxTurns) {
      gameState.isGameOver = true
      
      if (gameState.coolPlayer.itemCount > gameState.hotPlayer.itemCount) {
        gameState.winner = PlayerType.COOL
      } else if (gameState.hotPlayer.itemCount > gameState.coolPlayer.itemCount) {
        gameState.winner = PlayerType.HOT
      } else {
        gameState.isDraw = true
      }
    }
  }

  public switchPlayer(gameState: GameState): void {
    if (gameState.currentPlayer === PlayerType.COOL) {
      gameState.currentPlayer = PlayerType.HOT
    } else {
      gameState.currentPlayer = PlayerType.COOL
      gameState.currentTurn++
    }
  }

  private getPositionInDirection(position: Position, direction: Direction, distance = 1): Position {
    switch (direction) {
      case Direction.UP:
        return { x: position.x, y: position.y - distance }
      case Direction.RIGHT:
        return { x: position.x + distance, y: position.y }
      case Direction.DOWN:
        return { x: position.x, y: position.y + distance }
      case Direction.LEFT:
        return { x: position.x - distance, y: position.y }
      default:
        return position
    }
  }

  private isOutOfBounds(gameState: GameState, position: Position): boolean {
    return position.x < 0 || position.x >= gameState.map.width ||
           position.y < 0 || position.y >= gameState.map.height
  }
}