import { IConnectionHandler, IGameLogger, GameState, PlayerType, ActionType, Direction, Command } from '../types'
import { GameLogic } from './GameLogic'
import { SurroundingInfoGenerator } from './SurroundingInfoGenerator'

export class CHaserServer {
  private connectionHandler: IConnectionHandler
  private logger?: IGameLogger
  private gameLogic = new GameLogic()
  private surroundingInfoGenerator = new SurroundingInfoGenerator()
  private gameState?: GameState

  // Expose for testing
  public get testGameLogic() { return this.gameLogic }
  public set testGameState(state: GameState | undefined) { this.gameState = state }

  constructor(connectionHandler: IConnectionHandler, logger?: IGameLogger) {
    this.connectionHandler = connectionHandler
    this.logger = logger
  }

  public async start(): Promise<void> {
    await this.connectionHandler.start()
  }

  public async stop(): Promise<void> {
    await this.connectionHandler.stop()
  }

  public async startGame(mapString: string): Promise<void> {
    // Initialize game state
    this.gameState = this.gameLogic.createGameFromMapString(mapString)
    this.logger?.logGameStart(this.gameState)

    // Wait for connections
    await this.connectionHandler.waitForConnections()

    // Receive team names
    const teamNames = await this.receiveTeamNames()
    this.gameState.coolPlayer.name = teamNames.cool
    this.gameState.hotPlayer.name = teamNames.hot

    // Wait for ready signals
    await this.waitForReady()

    // Send ready signal to both players
    await this.connectionHandler.sendMessage('cool', '@')
    await this.connectionHandler.sendMessage('hot', '@')

    // Main game loop
    while (!this.gameState.isGameOver) {
      await this.processTurn()
      this.gameLogic.switchPlayer(this.gameState)
      this.gameLogic.checkGameEnd(this.gameState)
    }

    this.logger?.logGameEnd(this.gameState)
  }

  public async receiveTeamNames(): Promise<{ cool: string; hot: string }> {
    const [coolName, hotName] = await Promise.all([
      this.connectionHandler.receiveMessage('cool'),
      this.connectionHandler.receiveMessage('hot')
    ])

    return {
      cool: coolName.substring(0, 8), // Max 8 characters for half-width
      hot: hotName.substring(0, 8)
    }
  }

  public async waitForReady(): Promise<void> {
    const [coolReady, hotReady] = await Promise.all([
      this.connectionHandler.receiveMessage('cool'),
      this.connectionHandler.receiveMessage('hot')
    ])

    if (coolReady !== '@' || hotReady !== '@') {
      throw new Error('Invalid ready signal received')
    }
  }

  public async processTurn(): Promise<void> {
    if (!this.gameState) {
      throw new Error('Game not started')
    }

    const currentPlayerId = this.gameState.currentPlayer === PlayerType.COOL ? 'cool' : 'hot'

    // Wait for turn request
    const turnRequest = await this.connectionHandler.receiveMessage(currentPlayerId)
    if (turnRequest !== 'gr') {
      throw new Error(`Invalid turn request: ${turnRequest}`)
    }

    // Send surrounding info
    const surroundingInfo = this.surroundingInfoGenerator.generateSurroundingInfo(
      this.gameState,
      this.gameState.currentPlayer
    )
    await this.connectionHandler.sendMessage(currentPlayerId, surroundingInfo)

    // Receive command
    const commandString = await this.connectionHandler.receiveMessage(currentPlayerId)
    const command = this.parseCommand(commandString)

    // Execute action
    const result = this.gameLogic.executeAction(this.gameState, command)
    this.logger?.logTurn(
      this.gameState.currentTurn,
      this.gameState.currentPlayer,
      command,
      this.gameState
    )

    // Send updated surrounding info
    const updatedSurroundingInfo = this.surroundingInfoGenerator.generateSurroundingInfo(
      this.gameState,
      this.gameState.currentPlayer
    )
    await this.connectionHandler.sendMessage(currentPlayerId, updatedSurroundingInfo)

    // Wait for turn end signal
    const turnEnd = await this.connectionHandler.receiveMessage(currentPlayerId)
    if (turnEnd !== '#') {
      throw new Error(`Invalid turn end signal: ${turnEnd}`)
    }

    // Handle game result
    if (result.gameResult) {
      this.gameState.isGameOver = true
      if (result.gameResult.includes('win')) {
        this.gameState.winner = this.gameState.currentPlayer
      } else if (result.gameResult.includes('draw')) {
        this.gameState.isDraw = true
      } else {
        // Current player loses
        this.gameState.winner = this.gameState.currentPlayer === PlayerType.COOL 
          ? PlayerType.HOT 
          : PlayerType.COOL
      }
    }
  }

  private parseCommand(commandString: string): Command {
    if (commandString.length !== 2) {
      throw new Error(`Invalid command format: ${commandString}`)
    }

    const actionChar = commandString[0]
    const directionChar = commandString[1]

    let action: ActionType
    switch (actionChar) {
      case 'w':
        action = ActionType.WALK
        break
      case 'p':
        action = ActionType.PUT
        break
      case 'l':
        action = ActionType.LOOK
        break
      case 's':
        action = ActionType.SEARCH
        break
      default:
        throw new Error(`Invalid action: ${actionChar}`)
    }

    let direction: Direction
    switch (directionChar) {
      case 'u':
        direction = Direction.UP
        break
      case 'r':
        direction = Direction.RIGHT
        break
      case 'd':
        direction = Direction.DOWN
        break
      case 'l':
        direction = Direction.LEFT
        break
      default:
        throw new Error(`Invalid direction: ${directionChar}`)
    }

    return { action, direction }
  }
}