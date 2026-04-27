<script lang="ts">
  import GameCanvas from '../components/GameCanvas.svelte';
  import ScoreBoard from '../components/ScoreBoard.svelte';
  import NextPiece from '../components/NextPiece.svelte';
  import HoldPiece from '../components/HoldPiece.svelte';
  import GameOverlay from '../components/GameOverlay.svelte';
</script>

<svelte:head>
  <title>Tetris</title>
</svelte:head>

<main>
  <div class="game-layout">
    <div class="left-panel">
      <HoldPiece />
      <ScoreBoard />
    </div>

    <div class="board-wrap">
      <GameCanvas />
      <GameOverlay />
    </div>

    <div class="right-panel">
      <NextPiece />
    </div>
  </div>

  <div class="controls">
    <span>← → Move</span>
    <span>↑ Rotate</span>
    <span>↓ Soft drop</span>
    <span>Space Hard drop</span>
    <span>C Hold</span>
    <span>P Pause</span>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #0f172a;
    color: #e2e8f0;
    font-family: 'Courier New', monospace;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .game-layout {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .board-wrap {
    position: relative;
    border: 2px solid #334155;
    border-radius: 4px;
    overflow: hidden;
  }

  .left-panel, .right-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    min-width: 90px;
  }

  .controls {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
    font-size: 12px;
    color: #475569;
  }
</style>
