<script lang="ts">
  import { game } from '../lib/stores/gameStore';
  $: status = $game.status;
</script>

{#if status === 'idle'}
  <div class="overlay">
    <div class="title">TETRIS</div>
    <div class="hint">Press SPACE to start</div>
  </div>
{:else if status === 'paused'}
  <div class="overlay">
    <div class="title">PAUSED</div>
    <div class="hint">Press P to resume</div>
  </div>
{:else if status === 'gameover'}
  <div class="overlay">
    <div class="title">GAME OVER</div>
    <div class="hint">Press SPACE to restart</div>
  </div>
{/if}

<style>
  .overlay {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: rgba(0,0,0,0.7); gap: 12px;
  }
  .title { font-size: 32px; font-weight: bold; color: #e2e8f0; letter-spacing: 4px; }
  .hint { font-size: 14px; color: #94a3b8; }
</style>
