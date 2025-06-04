import { GameState, Position, PlayerType, CellType } from '../types'

export class SurroundingInfoGenerator {
  public generateSurroundingInfo(gameState: GameState, playerType: PlayerType): string {
    const gameRunning = gameState.isGameOver ? '0' : '1'
    const player = playerType === PlayerType.COOL ? gameState.coolPlayer : gameState.hotPlayer
    const surroundingCells = this.getSurroundingCells(gameState, player.position, playerType)
    
    return gameRunning + surroundingCells.join('')
  }

  public getSurroundingCells(gameState: GameState, position: Position, playerType: PlayerType): number[] {
    const { x, y } = position
    const cells: number[] = []
    const opponent = playerType === PlayerType.COOL ? gameState.hotPlayer : gameState.coolPlayer

    // 3x3グリッドを左上から右下の順で処理（中央の自分の位置は除外）
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) {
          // 中央（自分の位置）はスキップ
          continue
        }

        const checkX = x + dx
        const checkY = y + dy

        // 範囲外の場合は壁（ブロック）として扱う
        if (checkX < 0 || checkX >= gameState.map.width || checkY < 0 || checkY >= gameState.map.height) {
          cells.push(CellType.BLOCK)
          continue
        }

        // 相手プレイヤーがいるかチェック
        if (opponent.position.x === checkX && opponent.position.y === checkY) {
          cells.push(CellType.PLAYER)
          continue
        }

        // 通常のセル
        const cellType = gameState.map.cells[checkY][checkX]
        cells.push(cellType)
      }
    }

    return cells
  }
}