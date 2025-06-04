import { describe, it, expect } from 'vitest'
import { MapManager } from '../core/MapManager'
import { CellType } from '../types'

describe('MapManager', () => {
  describe('loadMapFromString', () => {
    it('should parse valid map string correctly', () => {
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

      const mapManager = new MapManager()
      const gameMap = mapManager.loadMapFromString(mapString)

      expect(gameMap.name).toBe('TestMap')
      expect(gameMap.maxTurns).toBe(100)
      expect(gameMap.width).toBe(17)
      expect(gameMap.height).toBe(15)
      expect(gameMap.coolStartPosition).toEqual({ x: 2, y: 2 })
      expect(gameMap.hotStartPosition).toEqual({ x: 15, y: 14 })
    })

    it('should validate field size is 15x17', () => {
      const invalidMapString = `N:TestMap
T:100
S:10,10
D:0,1,2,3,0,1,2,3,0,1
C:2,2
H:8,8`

      const mapManager = new MapManager()
      
      expect(() => {
        mapManager.loadMapFromString(invalidMapString)
      }).toThrow('マップサイズは15x17である必要があります')
    })

    it('should validate minimum item count (36 items)', () => {
      const mapString = `N:TestMap
T:100
S:15,17
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
C:2,2
H:14,15`

      const mapManager = new MapManager()
      
      expect(() => {
        mapManager.loadMapFromString(mapString)
      }).toThrow('アイテム数は36個以上である必要があります')
    })

    it('should validate point symmetry of items and blocks', () => {
      const asymmetricMapString = `N:TestMap
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
D:0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2
C:2,2
H:14,15`

      const mapManager = new MapManager()
      
      expect(() => {
        mapManager.loadMapFromString(asymmetricMapString)
      }).toThrow('アイテムとブロックは中心点対称に配置されている必要があります')
    })

    it('should accept valid point symmetric map', () => {
      const symmetricMapString = `N:TestMap
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

      const mapManager = new MapManager()
      const gameMap = mapManager.loadMapFromString(symmetricMapString)

      expect(gameMap.name).toBe('TestMap')
      expect(mapManager.countItems(gameMap)).toBeGreaterThanOrEqual(36)
    })
  })

  describe('validatePointSymmetry', () => {
    it('should return true for point symmetric configuration', () => {
      const mapManager = new MapManager()
      const cells: CellType[][] = [
        [CellType.FLOOR, CellType.ITEM, CellType.FLOOR],
        [CellType.BLOCK, CellType.FLOOR, CellType.BLOCK],
        [CellType.FLOOR, CellType.ITEM, CellType.FLOOR],
      ]

      expect(mapManager.validatePointSymmetry(cells)).toBe(true)
    })

    it('should return false for non-point symmetric configuration', () => {
      const mapManager = new MapManager()
      const cells: CellType[][] = [
        [CellType.FLOOR, CellType.ITEM, CellType.FLOOR],
        [CellType.BLOCK, CellType.FLOOR, CellType.FLOOR],
        [CellType.FLOOR, CellType.ITEM, CellType.FLOOR],
      ]

      expect(mapManager.validatePointSymmetry(cells)).toBe(false)
    })
  })

  describe('countItems', () => {
    it('should count items correctly', () => {
      const mapManager = new MapManager()
      const gameMap = {
        name: 'Test',
        maxTurns: 100,
        width: 3,
        height: 3,
        cells: [
          [CellType.FLOOR, CellType.ITEM, CellType.FLOOR],
          [CellType.BLOCK, CellType.FLOOR, CellType.ITEM],
          [CellType.ITEM, CellType.BLOCK, CellType.ITEM],
        ],
        coolStartPosition: { x: 0, y: 0 },
        hotStartPosition: { x: 2, y: 2 },
      }

      expect(mapManager.countItems(gameMap)).toBe(4)
    })
  })
})