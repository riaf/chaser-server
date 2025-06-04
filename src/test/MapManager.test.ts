import { describe, expect, it } from "vitest";
import { MapManager } from "../core/MapManager";
import { CellType } from "../types";

describe("MapManager", () => {
	describe("loadMapFromString", () => {
		it("should parse valid map string correctly", () => {
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
H:14,15`;

			const mapManager = new MapManager();
			const gameMap = mapManager.loadMapFromString(mapString);

			expect(gameMap.name).toBe("TestMap");
			expect(gameMap.maxTurns).toBe(100);
			expect(gameMap.width).toBe(17);
			expect(gameMap.height).toBe(15);
			expect(gameMap.coolStartPosition).toEqual({ x: 2, y: 2 });
			expect(gameMap.hotStartPosition).toEqual({ x: 15, y: 14 });
		});

		it("should accept any valid map size", () => {
			const smallMapString = `N:SmallMap
T:50
S:5,7
D:0,3,3,3,3,3,0
D:3,0,0,0,0,0,3
D:3,0,2,0,2,0,3
D:3,0,0,0,0,0,3
D:0,3,3,3,3,3,0
C:1,1
H:5,3`;

			const mapManager = new MapManager();
			const gameMap = mapManager.loadMapFromString(smallMapString);

			expect(gameMap.width).toBe(7);
			expect(gameMap.height).toBe(5);
			expect(gameMap.name).toBe("SmallMap");
		});

		it("should validate map dimensions match declared size", () => {
			const mismatchMapString = `N:TestMap
T:100
S:5,5
D:0,1,2,3,0,1,2,3,0,1
C:2,2
H:3,3`;

			const mapManager = new MapManager();

			expect(() => {
				mapManager.loadMapFromString(mismatchMapString);
			}).toThrow("宣言されたサイズと実際のマップサイズが一致しません");
		});

		it("should validate minimum item count with options", () => {
			const mapString = `N:TestMap
T:100
S:5,5
D:0,0,0,0,0
D:0,3,0,3,0
D:0,0,0,0,0
D:0,3,0,3,0
D:0,0,0,0,0
C:1,1
H:3,3`;

			const mapManager = new MapManager();

			expect(() => {
				mapManager.loadMapFromString(mapString, { minItemCount: 10 });
			}).toThrow("アイテム数は10個以上である必要があります");
		});

		it("should accept map with sufficient items for custom minimum", () => {
			const mapString = `N:TestMap
T:100
S:5,5
D:0,3,3,3,0
D:3,0,0,0,3
D:3,0,2,0,3
D:3,0,0,0,3
D:0,3,3,3,0
C:1,1
H:3,3`;

			const mapManager = new MapManager();
			const gameMap = mapManager.loadMapFromString(mapString, {
				minItemCount: 8,
			});

			expect(mapManager.countItems(gameMap)).toBe(12);
		});

		it("should validate point symmetry of items and blocks", () => {
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
H:14,15`;

			const mapManager = new MapManager();

			expect(() => {
				mapManager.loadMapFromString(asymmetricMapString);
			}).toThrow(
				"アイテムとブロックは中心点対称に配置されている必要があります",
			);
		});

		it("should accept valid point symmetric map", () => {
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
H:14,15`;

			const mapManager = new MapManager();
			const gameMap = mapManager.loadMapFromString(symmetricMapString);

			expect(gameMap.name).toBe("TestMap");
			expect(mapManager.countItems(gameMap)).toBeGreaterThanOrEqual(36);
		});
	});

	describe("validatePointSymmetry", () => {
		it("should return true for point symmetric configuration", () => {
			const mapManager = new MapManager();
			const cells: CellType[][] = [
				[CellType.FLOOR, CellType.ITEM, CellType.FLOOR],
				[CellType.BLOCK, CellType.FLOOR, CellType.BLOCK],
				[CellType.FLOOR, CellType.ITEM, CellType.FLOOR],
			];

			expect(mapManager.validatePointSymmetry(cells)).toBe(true);
		});

		it("should return false for non-point symmetric configuration", () => {
			const mapManager = new MapManager();
			const cells: CellType[][] = [
				[CellType.FLOOR, CellType.ITEM, CellType.FLOOR],
				[CellType.BLOCK, CellType.FLOOR, CellType.FLOOR],
				[CellType.FLOOR, CellType.ITEM, CellType.FLOOR],
			];

			expect(mapManager.validatePointSymmetry(cells)).toBe(false);
		});
	});

	describe("countItems", () => {
		it("should count items correctly", () => {
			const mapManager = new MapManager();
			const gameMap = {
				name: "Test",
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
			};

			expect(mapManager.countItems(gameMap)).toBe(4);
		});
	});
});
