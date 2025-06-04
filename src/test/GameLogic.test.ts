import { describe, it, expect } from 'vitest'
import { GameLogic } from '../core/GameLogic'
import { CellType, PlayerType, ActionType, Direction, GameResult } from '../types'

describe('GameLogic', () => {
  const createTestGameState = () => {
    const gameLogic = new GameLogic()
    const mapString = `N:TestMap
T:100
S:15,17
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D:0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0
D:0,3,0,2,0,2,0,2,0,2,0,2,0,2,0,3,0
D:0,3,2,0,2,0,2,0,2,0,2,0,2,0,2,3,0
D:0,3,0,2,0,2,0,2,0,2,0,2,0,2,0,3,0
D:0,3,2,0,2,0,2,0,2,0,2,0,2,0,2,3,0
D:0,3,0,2,0,2,0,2,0,2,0,2,0,2,0,3,0
D:0,3,2,0,2,0,2,0,2,0,2,0,2,0,2,3,0
D:0,3,0,2,0,2,0,2,0,2,0,2,0,2,0,3,0
D:0,3,2,0,2,0,2,0,2,0,2,0,2,0,2,3,0
D:0,3,0,2,0,2,0,2,0,2,0,2,0,2,0,3,0
D:0,3,2,0,2,0,2,0,2,0,2,0,2,0,2,3,0
D:0,3,0,2,0,2,0,2,0,2,0,2,0,2,0,3,0
D:0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
C:2,2
H:14,15`
    return gameLogic.createGameFromMapString(mapString)
  }

  describe('createGameFromMapString', () => {
    it('should create game state from map string', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()

      expect(gameState.map.name).toBe('TestMap')
      expect(gameState.coolPlayer.position).toEqual({ x: 2, y: 2 })
      expect(gameState.hotPlayer.position).toEqual({ x: 15, y: 14 })
      expect(gameState.currentPlayer).toBe(PlayerType.COOL)
      expect(gameState.currentTurn).toBe(1)
      expect(gameState.isGameOver).toBe(false)
    })
  })

  describe('executeAction - walk', () => {
    it('should move player to valid position', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()
      
      // Move to position where we can walk down
      gameState.coolPlayer.position = { x: 2, y: 3 }
      
      const result = gameLogic.executeAction(gameState, { 
        action: ActionType.WALK, 
        direction: Direction.DOWN 
      })

      expect(result.success).toBe(true)
      expect(result.newPosition).toEqual({ x: 2, y: 4 })
      expect(gameState.coolPlayer.position).toEqual({ x: 2, y: 4 })
    })

    it('should fail when walking into wall', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()
      
      // Move to edge and try to walk out of bounds
      gameState.coolPlayer.position = { x: 0, y: 0 }
      
      const result = gameLogic.executeAction(gameState, { 
        action: ActionType.WALK, 
        direction: Direction.LEFT 
      })

      expect(result.success).toBe(false)
      expect(result.gameResult).toBe(GameResult.LOSE_BY_WALL_HIT)
      expect(gameState.coolPlayer.position).toEqual({ x: 0, y: 0 }) // Position unchanged
    })

    it('should fail when walking into block', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()
      
      // Initial position (2,2), try to walk right into block at (3,2)
      const result = gameLogic.executeAction(gameState, { 
        action: ActionType.WALK, 
        direction: Direction.RIGHT 
      })

      expect(result.success).toBe(false)
      expect(result.gameResult).toBe(GameResult.LOSE_BY_BLOCK_HIT)
    })

    it('should collect item when walking over it', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()
      
      // Move to position where up is an item (at row 1)
      gameState.coolPlayer.position = { x: 1, y: 2 }
      
      const result = gameLogic.executeAction(gameState, { 
        action: ActionType.WALK, 
        direction: Direction.UP 
      })

      expect(result.success).toBe(true)
      expect(result.itemObtained).toBe(true)
      expect(gameState.coolPlayer.itemCount).toBe(1)
      expect(gameState.map.cells[1][1]).toBe(CellType.FLOOR) // Item removed
      expect(gameState.map.cells[2][1]).toBe(CellType.BLOCK) // Previous position blocked
    })
  })

  describe('executeAction - put', () => {
    it('should place block in valid position', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()
      
      // Move to position where we can place block up (empty space)
      gameState.coolPlayer.position = { x: 2, y: 3 }
      
      const result = gameLogic.executeAction(gameState, { 
        action: ActionType.PUT, 
        direction: Direction.UP 
      })

      expect(result.success).toBe(true)
      expect(gameState.map.cells[2][2]).toBe(CellType.BLOCK)
    })

    it('should win when putting block on opponent', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()
      
      // Position players adjacent in empty areas (bottom row is all empty)
      gameState.coolPlayer.position = { x: 5, y: 14 }
      gameState.hotPlayer.position = { x: 6, y: 14 }
      
      const result = gameLogic.executeAction(gameState, { 
        action: ActionType.PUT, 
        direction: Direction.RIGHT 
      })

      expect(result.success).toBe(true)
      expect(result.gameResult).toBe(GameResult.WIN_BY_PUT)
      expect(gameState.isGameOver).toBe(true)
      expect(gameState.winner).toBe(PlayerType.COOL)
    })

    it('should not place block on existing block', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()
      
      // Try to place block on existing block - initial position (2,2), try putting right on block at (3,2)
      const result = gameLogic.executeAction(gameState, { 
        action: ActionType.PUT, 
        direction: Direction.RIGHT 
      })

      expect(result.success).toBe(false)
    })
  })

  describe('executeAction - look', () => {
    it('should return 3x3 area in specified direction', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()
      
      const result = gameLogic.executeAction(gameState, { 
        action: ActionType.LOOK, 
        direction: Direction.RIGHT 
      })

      expect(result.success).toBe(true)
      expect(result.lookResult).toBeDefined()
      expect(result.lookResult).toHaveLength(9)
    })
  })

  describe('executeAction - search', () => {
    it('should return 9 cells in straight line', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()
      
      const result = gameLogic.executeAction(gameState, { 
        action: ActionType.SEARCH, 
        direction: Direction.RIGHT 
      })

      expect(result.success).toBe(true)
      expect(result.searchResult).toBeDefined()
      expect(result.searchResult).toHaveLength(9)
    })
  })

  describe('checkSurrounded', () => {
    it('should detect when player is surrounded', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()
      
      // Surround player with blocks
      gameState.map.cells[1][2] = CellType.BLOCK // up
      gameState.map.cells[3][2] = CellType.BLOCK // down  
      gameState.map.cells[2][1] = CellType.BLOCK // left
      gameState.map.cells[2][3] = CellType.BLOCK // right
      
      const isSurrounded = gameLogic.checkSurrounded(gameState, gameState.coolPlayer.position)
      expect(isSurrounded).toBe(true)
    })

    it('should not detect surrounded when there is escape route', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()
      
      // Test position in empty area (bottom row)
      const testPosition = { x: 8, y: 14 }
      
      // Partially surround player - only block 3 directions, leave up open
      gameState.map.cells[14][7] = CellType.BLOCK // left
      gameState.map.cells[14][9] = CellType.BLOCK // right
      // down is out of bounds (treated as block)
      // up at (13,8) should be empty - this is our escape route
      
      const isSurrounded = gameLogic.checkSurrounded(gameState, testPosition)
      expect(isSurrounded).toBe(false)
    })
  })

  describe('checkGameEnd', () => {
    it('should end game when max turns reached with item count victory', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()
      
      gameState.currentTurn = gameState.map.maxTurns
      gameState.coolPlayer.itemCount = 10
      gameState.hotPlayer.itemCount = 5
      
      gameLogic.checkGameEnd(gameState)
      
      expect(gameState.isGameOver).toBe(true)
      expect(gameState.winner).toBe(PlayerType.COOL)
    })

    it('should end game with draw when item counts equal', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()
      
      gameState.currentTurn = gameState.map.maxTurns
      gameState.coolPlayer.itemCount = 10
      gameState.hotPlayer.itemCount = 10
      
      gameLogic.checkGameEnd(gameState)
      
      expect(gameState.isGameOver).toBe(true)
      expect(gameState.isDraw).toBe(true)
    })
  })

  describe('switchPlayer', () => {
    it('should switch from Cool to Hot', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()
      
      gameLogic.switchPlayer(gameState)
      
      expect(gameState.currentPlayer).toBe(PlayerType.HOT)
    })

    it('should switch from Hot to Cool and increment turn', () => {
      const gameLogic = new GameLogic()
      const gameState = createTestGameState()
      
      gameState.currentPlayer = PlayerType.HOT
      const initialTurn = gameState.currentTurn
      
      gameLogic.switchPlayer(gameState)
      
      expect(gameState.currentPlayer).toBe(PlayerType.COOL)
      expect(gameState.currentTurn).toBe(initialTurn + 1)
    })
  })
})