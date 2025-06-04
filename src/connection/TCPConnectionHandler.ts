import * as net from "node:net";
import type { IConnectionHandler } from "../types";

interface TCPConnectionConfig {
	coolPort?: number;
	hotPort?: number;
	timeout?: number;
}

export class TCPConnectionHandler implements IConnectionHandler {
	private coolPort: number;
	private hotPort: number;
	private timeout: number;
	private coolServer?: net.Server;
	private hotServer?: net.Server;
	private coolSocket?: net.Socket;
	private hotSocket?: net.Socket;
	private coolBuffer = "";
	private hotBuffer = "";

	constructor(config: TCPConnectionConfig = {}) {
		this.coolPort = config.coolPort ?? 40000;
		this.hotPort = config.hotPort ?? 50000;
		this.timeout = config.timeout ?? 180000; // 3 minutes
	}

	public async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			let serversStarted = 0;
			const totalServers = 2;

			const onServerListening = () => {
				serversStarted++;
				if (serversStarted === totalServers) {
					resolve();
				}
			};

			// Cool server
			this.coolServer = net.createServer((socket) => {
				this.coolSocket = socket;
				this.setupSocket(socket, "cool");
			});

			this.coolServer.on("listening", onServerListening);
			this.coolServer.on("error", reject);
			this.coolServer.listen(this.coolPort);

			// Hot server
			this.hotServer = net.createServer((socket) => {
				this.hotSocket = socket;
				this.setupSocket(socket, "hot");
			});

			this.hotServer.on("listening", onServerListening);
			this.hotServer.on("error", reject);
			this.hotServer.listen(this.hotPort);
		});
	}

	public async stop(): Promise<void> {
		const promises: Promise<void>[] = [];

		if (this.coolSocket) {
			promises.push(
				new Promise((resolve) => {
					this.coolSocket?.end();
					this.coolSocket?.on("close", () => resolve());
				}),
			);
		}

		if (this.hotSocket) {
			promises.push(
				new Promise((resolve) => {
					this.hotSocket?.end();
					this.hotSocket?.on("close", () => resolve());
				}),
			);
		}

		if (this.coolServer) {
			promises.push(
				new Promise((resolve) => {
					this.coolServer?.close(() => resolve());
				}),
			);
		}

		if (this.hotServer) {
			promises.push(
				new Promise((resolve) => {
					this.hotServer?.close(() => resolve());
				}),
			);
		}

		await Promise.all(promises);

		this.coolSocket = undefined;
		this.hotSocket = undefined;
		this.coolServer = undefined;
		this.hotServer = undefined;
		this.coolBuffer = "";
		this.hotBuffer = "";
	}

	public async sendMessage(playerId: string, message: string): Promise<void> {
		const socket = this.getSocket(playerId);
		if (!socket || socket.destroyed) {
			throw new Error(`Player ${playerId} is not connected`);
		}

		return new Promise((resolve, reject) => {
			socket.write(message, (error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}

	public async receiveMessage(playerId: string): Promise<string> {
		const socket = this.getSocket(playerId);
		if (!socket || socket.destroyed) {
			throw new Error(`Player ${playerId} is not connected`);
		}

		return new Promise((resolve, reject) => {
			const buffer = this.getBuffer(playerId);

			// Check if we already have a complete message
			const lineEnd = buffer.indexOf("\\r\\n");
			if (lineEnd !== -1) {
				const message = buffer.substring(0, lineEnd);
				this.setBuffer(playerId, buffer.substring(lineEnd + 2));
				resolve(message);
				return;
			}

			// Set up timeout
			const timeoutId = setTimeout(() => {
				reject(new Error(`Timeout waiting for message from ${playerId}`));
			}, this.timeout);

			// Listen for data
			const onData = (data: Buffer) => {
				const currentBuffer = this.getBuffer(playerId);
				const newBuffer = currentBuffer + data.toString();
				this.setBuffer(playerId, newBuffer);

				const lineEnd = newBuffer.indexOf("\\r\\n");
				if (lineEnd !== -1) {
					clearTimeout(timeoutId);
					socket.off("data", onData);
					socket.off("close", onClose);
					socket.off("error", onError);

					const message = newBuffer.substring(0, lineEnd);
					this.setBuffer(playerId, newBuffer.substring(lineEnd + 2));
					resolve(message);
				}
			};

			const onClose = () => {
				clearTimeout(timeoutId);
				socket.off("data", onData);
				socket.off("close", onClose);
				socket.off("error", onError);
				reject(new Error(`Connection closed by ${playerId}`));
			};

			const onError = (error: Error) => {
				clearTimeout(timeoutId);
				socket.off("data", onData);
				socket.off("close", onClose);
				socket.off("error", onError);
				reject(error);
			};

			socket.on("data", onData);
			socket.on("close", onClose);
			socket.on("error", onError);
		});
	}

	public async waitForConnections(): Promise<{ cool: string; hot: string }> {
		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				reject(new Error("Timeout waiting for player connections"));
			}, this.timeout);

			const checkConnections = () => {
				if (this.isConnected("cool") && this.isConnected("hot")) {
					clearTimeout(timeoutId);
					resolve({ cool: "cool", hot: "hot" });
				}
			};

			const onCoolConnection = () => {
				checkConnections();
			};

			const onHotConnection = () => {
				checkConnections();
			};

			if (this.coolServer) {
				this.coolServer.on("connection", onCoolConnection);
			}

			if (this.hotServer) {
				this.hotServer.on("connection", onHotConnection);
			}

			// Check if already connected
			checkConnections();
		});
	}

	public isConnected(playerId: string): boolean {
		const socket = this.getSocket(playerId);
		return socket !== undefined && !socket.destroyed;
	}

	public async disconnect(playerId: string): Promise<void> {
		const socket = this.getSocket(playerId);
		if (socket && !socket.destroyed) {
			return new Promise((resolve) => {
				socket.end();
				socket.on("close", () => resolve());
			});
		}
	}

	private setupSocket(socket: net.Socket, playerId: string): void {
		socket.setEncoding("utf8");
		socket.setTimeout(this.timeout);

		socket.on("timeout", () => {
			socket.destroy();
		});

		socket.on("error", (error) => {
			console.error(`Socket error for ${playerId}:`, error);
		});

		socket.on("close", () => {
			if (playerId === "cool") {
				this.coolSocket = undefined;
				this.coolBuffer = "";
			} else {
				this.hotSocket = undefined;
				this.hotBuffer = "";
			}
		});
	}

	private getSocket(playerId: string): net.Socket | undefined {
		return playerId === "cool" ? this.coolSocket : this.hotSocket;
	}

	private getBuffer(playerId: string): string {
		return playerId === "cool" ? this.coolBuffer : this.hotBuffer;
	}

	private setBuffer(playerId: string, buffer: string): void {
		if (playerId === "cool") {
			this.coolBuffer = buffer;
		} else {
			this.hotBuffer = buffer;
		}
	}
}
