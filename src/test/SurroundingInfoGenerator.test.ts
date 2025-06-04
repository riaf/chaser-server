import { describe, it, expect } from 'vitest'
import { SurroundingInfoGenerator } from '../core/SurroundingInfoGenerator'
import { CellType, GameState, PlayerType } from '../types'

describe('SurroundingInfoGenerator', () => {
  const createGameState = (): GameState => ({
    map: {
      name: 'TestMap',
      maxTurns: 100,
      width: 5,
      height: 5,
      cells: [
        [CellType.FLOOR, CellType.ITEM, CellType.FLOOR, CellType.BLOCK, CellType.FLOOR],
        [CellType.BLOCK, CellType.FLOOR, CellType.ITEM, CellType.FLOOR, CellType.ITEM],
        [CellType.FLOOR, CellType.ITEM, CellType.FLOOR, CellType.ITEM, CellType.FLOOR],
        [CellType.ITEM, CellType.FLOOR, CellType.ITEM, CellType.FLOOR, CellType.BLOCK],
        [CellType.FLOOR, CellType.BLOCK, CellType.FLOOR, CellType.ITEM, CellType.FLOOR],
      ],
      coolStartPosition: { x: 1, y: 1 },
      hotStartPosition: { x: 3, y: 3 },
    },
    coolPlayer: {
      type: PlayerType.COOL,
      name: 'CoolPlayer',
      position: { x: 1, y: 1 },
      itemCount: 0,
    },
    hotPlayer: {
      type: PlayerType.HOT,
      name: 'HotPlayer',
      position: { x: 3, y: 3 },
      itemCount: 0,
    },
    currentTurn: 1,
    currentPlayer: PlayerType.COOL,
    isGameOver: false,
    winner: null,
    isDraw: false,
  })

  describe('generateSurroundingInfo', () => {
    it('should generate correct 10-digit string for game in progress', () => {
      const generator = new SurroundingInfoGenerator()
      const gameState = createGameState()
      const info = generator.generateSurroundingInfo(gameState, PlayerType.COOL)

      expect(info).toHaveLength(9)
      expect(info[0]).toBe('1') // Game is running
      
      // Position (1,1) surroundings: 
      // 0 3 0
      // 2 X 3  (X is player position, excluded)
      // 0 3 0
      expect(info.substring(1)).toBe('03023030')
    })

    it('should generate correct info when game is over', () => {
      const generator = new SurroundingInfoGenerator()
      const gameState = createGameState()
      gameState.isGameOver = true
      
      const info = generator.generateSurroundingInfo(gameState, PlayerType.COOL)
      expect(info[0]).toBe('0') // Game is over
    })

    it('should detect opponent player in surrounding', () => {
      const generator = new SurroundingInfoGenerator()
      const gameState = createGameState()
      
      // Move hot player adjacent to cool player
      gameState.hotPlayer.position = { x: 2, y: 1 }
      
      const info = generator.generateSurroundingInfo(gameState, PlayerType.COOL)
      
      // Position (1,1) surroundings with opponent at (2,1):
      // 0 3 0
      // 2 X 1  (1 is opponent)
      // 0 3 0
      expect(info.substring(1)).toBe('03021030')
    })

    it('should handle edge of map correctly', () => {
      const generator = new SurroundingInfoGenerator()
      const gameState = createGameState()
      
      // Move player to corner
      gameState.coolPlayer.position = { x: 0, y: 0 }
      
      const info = generator.generateSurroundingInfo(gameState, PlayerType.COOL)
      
      // Position (0,0) surroundings (out of bounds treated as walls/blocks):
      // ? ? ?
      // ? X 3
      // ? 2 0
      // Out of bounds should be treated as 2 (block)
      expect(info.substring(1)).toBe('22223220')
    })

    it('should handle player in center of 3x3 area', () => {
      const generator = new SurroundingInfoGenerator()
      const gameState = createGameState()
      
      // Move player to center
      gameState.coolPlayer.position = { x: 2, y: 2 }
      
      const info = generator.generateSurroundingInfo(gameState, PlayerType.COOL)
      
      // Position (2,2) surroundings:
      // 3 0 3
      // 3 X 3  
      // 3 0 3
      expect(info.substring(1)).toBe('03033031')
    })
  })

  describe('getSurroundingCells', () => {
    it('should return correct 3x3 area around position', () => {
      const generator = new SurroundingInfoGenerator()
      const gameState = createGameState()
      
      const cells = generator.getSurroundingCells(gameState, { x: 2, y: 2 }, PlayerType.COOL)
      
      expect(cells).toHaveLength(8)
      // Expected order: top-left to bottom-right, excluding center
      expect(cells).toEqual([0, 3, 0, 3, 3, 0, 3, 1])
    })

    it('should exclude center position (player position)', () => {
      const generator = new SurroundingInfoGenerator()
      const gameState = createGameState()
      
      const cells = generator.getSurroundingCells(gameState, { x: 1, y: 1 }, PlayerType.COOL)
      
      // Should have 8 elements (3x3 - center)
      expect(cells).toHaveLength(8)
    })

    it('should handle out of bounds as walls', () => {
      const generator = new SurroundingInfoGenerator()
      const gameState = createGameState()
      
      const cells = generator.getSurroundingCells(gameState, { x: 0, y: 0 }, PlayerType.COOL)
      
      // Out of bounds positions should be treated as blocks (2)
      expect(cells[0]).toBe(2) // top-left out of bounds
      expect(cells[1]).toBe(2) // top out of bounds  
      expect(cells[2]).toBe(2) // top-right out of bounds
      expect(cells[3]).toBe(2) // left out of bounds
    })
  })
})