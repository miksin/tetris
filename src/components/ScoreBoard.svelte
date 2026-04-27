<script lang="ts">
  import { game } from '../lib/stores/gameStore';
  $: state = $game;
</script>

<div class="scoreboard">
  <div class="stat"><span class="label">SCORE</span><span class="value">{state.score}</span></div>
  <div class="stat"><span class="label">LEVEL</span><span class="value">{state.level}</span></div>
  <div class="stat"><span class="label">LINES</span><span class="value">{state.lines}</span></div>
</div>

<style>
  .scoreboard {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    background: #1a1a2e;
    border-radius: 6px;
    min-width: 100px;
  }
  .stat { display: flex; flex-direction: column; gap: 2px; }
  .label { font-size: 11px; color: #64748b; letter-spacing: 1px; }
  .value { font-size: 22px; font-weight: bold; color: #e2e8f0; }
</style>
