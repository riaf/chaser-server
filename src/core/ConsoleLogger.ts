import {
	type Command,
	type GameState,
	type IGameLogger,
	PlayerType,
} from "../types";

export class ConsoleLogger implements IGameLogger {
	public logGameStart(gameState: GameState): void {
		console.log("=== ゲーム開始 ===");
		console.log(`マップ: ${gameState.map.name}`);
		console.log(`最大ターン数: ${gameState.map.maxTurns}`);
		console.log(
			`Cool: ${gameState.coolPlayer.name} (${gameState.coolPlayer.position.x}, ${gameState.coolPlayer.position.y})`,
		);
		console.log(
			`Hot: ${gameState.hotPlayer.name} (${gameState.hotPlayer.position.x}, ${gameState.hotPlayer.position.y})`,
		);
	}

	public logTurn(
		turn: number,
		player: PlayerType,
		command: Command,
		gameState: GameState,
	): void {
		const playerName =
			player === PlayerType.COOL
				? gameState.coolPlayer.name
				: gameState.hotPlayer.name;
		console.log(
			`ターン ${turn}: ${playerName} - ${command.action}${command.direction}`,
		);
	}

	public logGameEnd(gameState: GameState): void {
		console.log("=== ゲーム終了 ===");
		if (gameState.isDraw) {
			console.log("結果: 引き分け");
		} else if (gameState.winner) {
			const winnerName =
				gameState.winner === PlayerType.COOL
					? gameState.coolPlayer.name
					: gameState.hotPlayer.name;
			console.log(`勝者: ${winnerName}`);
		}
		console.log(
			`最終アイテム数 - Cool: ${gameState.coolPlayer.itemCount}, Hot: ${gameState.hotPlayer.itemCount}`,
		);
	}
}
