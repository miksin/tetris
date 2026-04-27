<script lang="ts">
  import { afterUpdate } from 'svelte';
  import { game } from '../lib/stores/gameStore';
  import { drawMiniPiece } from '../lib/renderer/canvas';

  const SIZE = 72;
  let canvas: HTMLCanvasElement | undefined;

  $: held = $game.held;
  $: canHold = $game.canHold;

  afterUpdate(() => {
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      if (held) {
        drawMiniPiece(ctx, held, SIZE, SIZE);
        if (!canHold) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(0, 0, SIZE, SIZE);
        }
      } else {
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, SIZE, SIZE);
      }
    }
  });
</script>

<div class="hold-wrap">
  <div class="label">HOLD</div>
  <canvas bind:this={canvas} width={SIZE} height={SIZE} />
</div>

<style>
  .hold-wrap { display:flex; flex-direction:column; gap:4px; align-items:center; }
  .label { font-size:11px; color:#64748b; letter-spacing:1px; margin-bottom:4px; }
  canvas { border-radius:4px; }
</style>
