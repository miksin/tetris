<script lang="ts">
  import { onMount } from 'svelte';
  import { game } from '../lib/stores/gameStore';
  import { clearCanvas, drawGrid, drawBoard, drawPiece, drawGhost } from '../lib/renderer/canvas';
  import { BOARD_COLS, BOARD_ROWS, CELL_SIZE } from '../lib/game/constants';

  const WIDTH = BOARD_COLS * CELL_SIZE;
  const HEIGHT = BOARD_ROWS * CELL_SIZE;

  let canvas: HTMLCanvasElement;
  let animId: number;

  function render() {
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const state = $game;
    clearCanvas(ctx, WIDTH, HEIGHT);
    drawGrid(ctx);
    drawBoard(ctx, state.board);
    if (state.ghost) drawGhost(ctx, state.ghost);
    if (state.active) drawPiece(ctx, state.active);
  }

  function handleKey(e: KeyboardEvent) {
    if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','KeyC','KeyP'].includes(e.code)) {
      e.preventDefault();
    }
    const status = $game.status;
    if ((status === 'idle' || status === 'gameover') && e.code === 'Space') {
      game.start();
      return;
    }
    if (e.code === 'KeyP') { game.pause(); return; }
    if (status !== 'playing') return;
    if (e.code === 'ArrowLeft') game.moveLeft();
    else if (e.code === 'ArrowRight') game.moveRight();
    else if (e.code === 'ArrowDown') game.softDrop();
    else if (e.code === 'ArrowUp') game.rotateCW();
    else if (e.code === 'Space') game.hardDrop();
    else if (e.code === 'KeyC') game.hold();
  }

  onMount(() => {
    window.addEventListener('keydown', handleKey);
    const unsubscribe = game.subscribe(() => {
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(render);
    });
    return () => {
      window.removeEventListener('keydown', handleKey);
      unsubscribe();
      cancelAnimationFrame(animId);
    };
  });
</script>

<canvas bind:this={canvas} width={WIDTH} height={HEIGHT} style="display:block;" />
