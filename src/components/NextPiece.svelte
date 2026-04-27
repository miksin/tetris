<script lang="ts">
  import { afterUpdate } from 'svelte';
  import { game } from '../lib/stores/gameStore';
  import { drawMiniPiece } from '../lib/renderer/canvas';

  const SIZE = 72;
  let canvases: (HTMLCanvasElement | undefined)[] = [];

  $: next = $game.next;

  afterUpdate(() => {
    for (let i = 0; i < next.length; i++) {
      const ctx = canvases[i]?.getContext('2d');
      if (ctx && next[i]) drawMiniPiece(ctx, next[i], SIZE, SIZE);
    }
  });
</script>

<div class="next-wrap">
  <div class="label">NEXT</div>
  {#each next as _type, i}
    <canvas bind:this={canvases[i]} width={SIZE} height={SIZE} />
  {/each}
</div>

<style>
  .next-wrap { display:flex; flex-direction:column; gap:4px; align-items:center; }
  .label { font-size:11px; color:#64748b; letter-spacing:1px; margin-bottom:4px; }
  canvas { border-radius:4px; }
</style>
