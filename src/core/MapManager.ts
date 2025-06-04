import { CellType, type GameMap, type Position } from "../types";

export class MapManager {
	public loadMapFromString(mapString: string): GameMap {
		const lines = mapString.trim().split("\n");
		let name = "";
		let maxTurns = 0;
		let width = 0;
		let height = 0;
		const cells: CellType[][] = [];
		let coolStartPosition: Position = { x: 0, y: 0 };
		let hotStartPosition: Position = { x: 0, y: 0 };

		for (const line of lines) {
			if (line.startsWith("N:")) {
				name = line.substring(2);
			} else if (line.startsWith("T:")) {
				maxTurns = Number.parseInt(line.substring(2), 10);
			} else if (line.startsWith("S:")) {
				const [h, w] = line
					.substring(2)
					.split(",")
					.map((n) => Number.parseInt(n, 10));
				height = h;
				width = w;
			} else if (line.startsWith("D:")) {
				const row = line
					.substring(2)
					.split(",")
					.map((n) => Number.parseInt(n, 10) as CellType);
				cells.push(row);
			} else if (line.startsWith("C:")) {
				const [y, x] = line
					.substring(2)
					.split(",")
					.map((n) => Number.parseInt(n, 10));
				coolStartPosition = { x, y };
			} else if (line.startsWith("H:")) {
				const [y, x] = line
					.substring(2)
					.split(",")
					.map((n) => Number.parseInt(n, 10));
				hotStartPosition = { x, y };
			}
		}

		if (height !== 15 || width !== 17) {
			throw new Error("マップサイズは15x17である必要があります");
		}

		const gameMap: GameMap = {
			name,
			maxTurns,
			width,
			height,
			cells,
			coolStartPosition,
			hotStartPosition,
		};

		const itemCount = this.countItems(gameMap);
		if (itemCount < 36) {
			throw new Error("アイテム数は36個以上である必要があります");
		}

		if (!this.validatePointSymmetry(cells)) {
			throw new Error(
				"アイテムとブロックは中心点対称に配置されている必要があります",
			);
		}

		return gameMap;
	}

	public validatePointSymmetry(cells: CellType[][]): boolean {
		const height = cells.length;
		const width = cells[0]?.length || 0;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const cell = cells[y][x];
				if (cell === CellType.ITEM || cell === CellType.BLOCK) {
					const symmetricY = height - 1 - y;
					const symmetricX = width - 1 - x;
					const symmetricCell = cells[symmetricY]?.[symmetricX];

					if (symmetricCell !== cell) {
						return false;
					}
				}
			}
		}

		return true;
	}

	public countItems(gameMap: GameMap): number {
		let count = 0;
		for (const row of gameMap.cells) {
			for (const cell of row) {
				if (cell === CellType.ITEM) {
					count++;
				}
			}
		}
		return count;
	}
}
