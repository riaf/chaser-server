import { TCPConnectionHandler } from "./connection/TCPConnectionHandler";
import { CHaserServer } from "./core/CHaserServer";
import { ConsoleLogger } from "./core/ConsoleLogger";

async function main() {
	const connectionHandler = new TCPConnectionHandler();
	const logger = new ConsoleLogger();
	const server = new CHaserServer(connectionHandler, logger);

	try {
		console.log("CHaserサーバーを開始しています...");
		await server.start();
		console.log("サーバーが開始されました。クライアントの接続を待機中...");

		// サンプルマップでゲームを開始
		const sampleMap = `N:サンプルマップ
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
H:14,15`;

		await server.startGame(sampleMap);
	} catch (error) {
		console.error("サーバーエラー:", error);
	} finally {
		await server.stop();
		console.log("サーバーを停止しました");
	}
}

if (require.main === module) {
	main().catch(console.error);
}

export { CHaserServer, TCPConnectionHandler, ConsoleLogger };
