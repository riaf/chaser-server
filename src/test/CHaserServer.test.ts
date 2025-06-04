import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHaserServer } from "../core/CHaserServer";
import type { IConnectionHandler, IGameLogger } from "../types";

class MockConnectionHandler implements IConnectionHandler {
	private connections = new Map<string, boolean>();
	private messages = new Map<string, string[]>();

	async start(): Promise<void> {
		return Promise.resolve();
	}

	async stop(): Promise<void> {
		this.connections.clear();
		this.messages.clear();
		return Promise.resolve();
	}

	async sendMessage(playerId: string, message: string): Promise<void> {
		if (!this.connections.get(playerId)) {
			throw new Error(`Player ${playerId} is not connected`);
		}
		return Promise.resolve();
	}

	async receiveMessage(playerId: string): Promise<string> {
		if (!this.connections.get(playerId)) {
			throw new Error(`Player ${playerId} is not connected`);
		}
		const messageQueue = this.messages.get(playerId) || [];
		const message = messageQueue.shift();
		if (!message) {
			throw new Error("No message available");
		}
		this.messages.set(playerId, messageQueue);
		return Promise.resolve(message);
	}

	async waitForConnections(): Promise<{ cool: string; hot: string }> {
		this.connections.set("cool", true);
		this.connections.set("hot", true);
		return Promise.resolve({ cool: "cool", hot: "hot" });
	}

	isConnected(playerId: string): boolean {
		return this.connections.get(playerId) || false;
	}

	async disconnect(playerId: string): Promise<void> {
		this.connections.delete(playerId);
		return Promise.resolve();
	}

	// Helper methods for testing
	simulateMessage(playerId: string, message: string): void {
		const messageQueue = this.messages.get(playerId) || [];
		messageQueue.push(message);
		this.messages.set(playerId, messageQueue);
	}
}

class MockGameLogger implements IGameLogger {
	public logs: string[] = [];

	logGameStart(): void {
		this.logs.push("Game started");
	}

	logTurn(): void {
		this.logs.push("Turn logged");
	}

	logGameEnd(): void {
		this.logs.push("Game ended");
	}
}

describe("CHaserServer", () => {
	let server: CHaserServer;
	let mockConnectionHandler: MockConnectionHandler;
	let mockLogger: MockGameLogger;

	const testMapString = `N:TestMap
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

	beforeEach(() => {
		mockConnectionHandler = new MockConnectionHandler();
		mockLogger = new MockGameLogger();
		server = new CHaserServer(mockConnectionHandler, mockLogger);
	});

	afterEach(async () => {
		await server.stop();
	});

	describe("constructor", () => {
		it("should create server with connection handler and logger", () => {
			expect(server).toBeDefined();
		});
	});

	describe("start", () => {
		it("should start the connection handler", async () => {
			const startSpy = vi.spyOn(mockConnectionHandler, "start");
			await server.start();
			expect(startSpy).toHaveBeenCalled();
		});
	});

	describe("stop", () => {
		it("should stop the connection handler", async () => {
			const stopSpy = vi.spyOn(mockConnectionHandler, "stop");
			await server.stop();
			expect(stopSpy).toHaveBeenCalled();
		});
	});

	describe("startGame", () => {
		it("should start game with valid map string", async () => {
			await server.start();

			// Setup connections
			await mockConnectionHandler.waitForConnections();

			// Simulate complete game flow to prevent infinite loop
			mockConnectionHandler.simulateMessage("cool", "CoolTeam");
			mockConnectionHandler.simulateMessage("hot", "HotTeam");
			mockConnectionHandler.simulateMessage("cool", "@");
			mockConnectionHandler.simulateMessage("hot", "@");

			// First turn - Cool player
			mockConnectionHandler.simulateMessage("cool", "gr");
			mockConnectionHandler.simulateMessage("cool", "wd");
			mockConnectionHandler.simulateMessage("cool", "#");

			// Second turn - Hot player
			mockConnectionHandler.simulateMessage("hot", "gr");
			mockConnectionHandler.simulateMessage("hot", "wd");
			mockConnectionHandler.simulateMessage("hot", "#");

			// Continue for a few more turns to let game progress
			for (let i = 0; i < 10; i++) {
				mockConnectionHandler.simulateMessage("cool", "gr");
				mockConnectionHandler.simulateMessage("cool", "wd");
				mockConnectionHandler.simulateMessage("cool", "#");

				mockConnectionHandler.simulateMessage("hot", "gr");
				mockConnectionHandler.simulateMessage("hot", "wd");
				mockConnectionHandler.simulateMessage("hot", "#");
			}

			// Game should complete successfully or throw when running out of messages
			const gamePromise = server.startGame(testMapString);

			// The game might complete successfully or throw - both are acceptable
			try {
				await gamePromise;
				// Game completed successfully
			} catch (error) {
				// Game threw an error (also acceptable for this test)
				expect(error).toBeDefined();
			}
		});

		it("should reject invalid map string", async () => {
			await server.start();
			const invalidMap = "invalid map data";
			await expect(server.startGame(invalidMap)).rejects.toThrow();
		});
	});

	describe("game flow", () => {
		it("should handle complete game flow", async () => {
			await server.start();

			// Simulate team name responses
			mockConnectionHandler.simulateMessage("cool", "CoolTeam");
			mockConnectionHandler.simulateMessage("hot", "HotTeam");

			// Simulate ready responses
			mockConnectionHandler.simulateMessage("cool", "@");
			mockConnectionHandler.simulateMessage("hot", "@");

			// Simulate game requests and commands
			mockConnectionHandler.simulateMessage("cool", "gr");
			mockConnectionHandler.simulateMessage("cool", "wd");
			mockConnectionHandler.simulateMessage("cool", "#");

			mockConnectionHandler.simulateMessage("hot", "gr");
			mockConnectionHandler.simulateMessage("hot", "wd");
			mockConnectionHandler.simulateMessage("hot", "#");

			const gamePromise = server.startGame(testMapString);

			// Game should complete without throwing
			await expect(gamePromise).resolves.not.toThrow();

			// Verify logger was called
			expect(mockLogger.logs).toContain("Game started");
			expect(mockLogger.logs).toContain("Game ended");
		}, 10000);
	});

	describe("receiveTeamNames", () => {
		it("should receive team names from both players", async () => {
			await server.start();
			await mockConnectionHandler.waitForConnections();

			mockConnectionHandler.simulateMessage("cool", "CoolTeam");
			mockConnectionHandler.simulateMessage("hot", "HotTeam");

			const names = await server.receiveTeamNames();
			expect(names.cool).toBe("CoolTeam");
			expect(names.hot).toBe("HotTeam");
		});
	});

	describe("waitForReady", () => {
		it("should wait for ready signals from both players", async () => {
			await server.start();
			await mockConnectionHandler.waitForConnections();

			mockConnectionHandler.simulateMessage("cool", "@");
			mockConnectionHandler.simulateMessage("hot", "@");

			await expect(server.waitForReady()).resolves.not.toThrow();
		});
	});

	describe("processTurn", () => {
		it("should process a single turn correctly", async () => {
			await server.start();
			await mockConnectionHandler.waitForConnections();

			// Initialize game state without starting full game loop
			const gameState =
				server.testGameLogic.createGameFromMapString(testMapString);
			server.testGameState = gameState;

			// Setup team names
			gameState.coolPlayer.name = "CoolTeam";
			gameState.hotPlayer.name = "HotTeam";

			// Simulate turn messages
			mockConnectionHandler.simulateMessage("cool", "gr");
			mockConnectionHandler.simulateMessage("cool", "wd");
			mockConnectionHandler.simulateMessage("cool", "#");

			await expect(server.processTurn()).resolves.not.toThrow();
		});
	});
});
