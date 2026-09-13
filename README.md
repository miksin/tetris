# Tetris

瀏覽器版的現代標準俄羅斯方塊（SRS、Hold、Ghost、Lock Delay、T-Spin/B2B），採極簡單色風格。

- 頁面背景 `#111`、已鎖定方塊 `#888`、活動中方塊 `#fff`、Ghost 為 2px 白色外框
- 完整設計規格見 `docs/superpowers/specs/2026-09-13-tetris-design.md`

## 技術棧

- TypeScript（strict mode）+ Vite
- Phaser 3（^3.80）
- Vitest 測試

架構採嚴格兩層切分：

- `src/core/`：無任何相依（不 import phaser）的遊戲邏輯，所有規則集中於此，由 `Game.tick(dt, input)` 驅動
- `src/render/`：薄的 Phaser 呈現層，只負責把鍵盤輸入轉成輸入資料、每帧呼叫一次 `tick`，並繪製唯讀的 snapshot

## 開發方式

```bash
npm install
npm run dev          # 啟動 Vite 開發伺服器
npm test             # Vitest 單次執行
npm test:watch       # Vitest watch 模式
npx tsc --noEmit     # 型別檢查
npm run build        # tsc --noEmit + vite build
```

開發流程遵循 `docs/superpowers/plans/2026-09-13-tetris.md` 的任務清單，每個任務皆為 TDD 循環：先寫失敗測試（紅）→ 實作（綠）→ `npx tsc --noEmit` 通過 → commit。任務概覽：

1. 專案鷹架（Vite + TS + Phaser + Vitest）
2. Core 型別與 7-bag 隨機器
3. 方塊形狀、SRS kick 表、旋轉、Ghost
4. Board（碰撞、鎖定、消行）
5. 遊戲狀態機（重力、落下、鎖定、計分）
6. 進階行為測試（lock delay、hold 一次、DAS/ARR、T-spin/B2B）
7. InputController（鍵盤輸入）
8. BoardScene + Phaser 啟動
9. 完整驗證 + 手動試玩

## 維護

### 程式碼布局

```
src/
  core/               # 純邏輯，禁止 import phaser
    types.ts          # PieceType、Snapshot、Held 等型別
    constants.ts      # 棋盤尺寸、計時參數、計分表、SRS kick 表
    bag.ts            # 7-bag 隨機器
    piece.ts          # 形狀矩陣旋轉、tryKick、ghostY
    board.ts          # collide / lock / clearLines
    game.ts           # 狀態機：spawn、DAS/ARR、重力、鎖定、計分
  render/             # Phaser 呈現層
    main.ts           # Phaser.Game 啟動（720×720，背景 0x111111）
    board-scene.ts    # layout()（純函式，可測）+ BoardScene 繪製
    input-controller.ts
  core/__tests__/     # bag / piece / board / game 測試
  render/__tests__/   # input-controller / board-scene 測試
```

### 關鍵常數與遊戲參數（`src/core/constants.ts`）

- 棋盤：10 寬 × 22 高（頂部 2 列為隱藏生成區，可見範圍 10×20），格子 32px
- **DAS**：`DAS_MS = 170`ms；**ARR**：`ARR_MS = 40`ms；軟降 `SOFT_DROP_MS = 40`ms/格
- **Lock delay**：`LOCK_DELAY_MS = 500`ms，移動/旋轉重置計時上限 `LOCK_RESET_CAP = 15` 次
- **重力公式**：`gravityMs(level) = max(50, floor(1000 × 0.85^(level-1)))` ms/格
- **等級**：`level = floor(lines / 10) + 1`
- **計分**：軟降 1 分/格、硬降 2 分/格；消行 100/300/500/800 × 等級；T-spin 800/1200/1600（簡化 3 角判定）；Back-to-Back ×`B2B_MULT = 1.5`
- 預覽佇列 `NEXT_VISIBLE = 5` 顆
- SRS kick 表：JLSTZ 用 `KICKS_JLSTZ`，I 用 `KICKS_I`（螢幕座標 y 向下，SRS 的 +y（上）已取負儲存）

### 鍵盤對應（`src/render/input-controller.ts`）

- ←/→ 移動、↓ 軟降、Space 硬降
- ↑/X 順時針旋轉、Z/Ctrl 逆時針旋轉
- C/Shift Hold、P/Escape 暫停（Game Over 時重新開始）

## 部署

```bash
npm run build        # 產生 dist/
```

`vite.config.ts` 已設定 `base: './'`（相對路徑），因此 `dist/` 可直接放到任何靜態主機，不需調整資源路徑：

- **Cloudflare Pages**：建置指令 `npm run build`，輸出目錄 `dist`
- **GitHub Pages**：把 `dist/` 內容推到 `gh-pages` 分支（或用官方 Actions），從該分支提供服務
