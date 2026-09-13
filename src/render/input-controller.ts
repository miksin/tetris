import { Held, Actions } from '../core/types';

export interface ActionsWithPause extends Actions { pause: boolean; start: boolean }

export class InputController {
  private state: Held = { left: false, right: false, down: false, actions: { rotCW: false, rotCCW: false, hard: false, hold: false } };
  private pending: ActionsWithPause = { rotCW: false, rotCCW: false, hard: false, hold: false, pause: false, start: false };
  private onKeyDown = (e: KeyboardEvent) => { this.handle(e, true); };
  private onKeyUp = (e: KeyboardEvent) => { this.handle(e, false); };

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private handle(e: KeyboardEvent, down: boolean): void {
    switch (e.code) {
      case 'ArrowLeft': this.state.left = down; e.preventDefault(); break;
      case 'ArrowRight': this.state.right = down; e.preventDefault(); break;
      case 'ArrowDown': this.state.down = down; e.preventDefault(); break;
      case 'ArrowUp': case 'KeyX': if (down && !e.repeat) this.pending.rotCW = true; e.preventDefault(); break;
      case 'KeyZ': case 'ControlLeft': case 'ControlRight': if (down && !e.repeat) this.pending.rotCCW = true; break;
      case 'Space': if (down && !e.repeat) this.pending.hard = true; e.preventDefault(); break;
      case 'KeyC': case 'ShiftLeft': case 'ShiftRight': if (down && !e.repeat) this.pending.hold = true; break;
      case 'KeyP': case 'Escape': if (down && !e.repeat) this.pending.pause = true; break;
      case 'Enter': if (down && !e.repeat) this.pending.start = true; e.preventDefault(); break;
    }
  }

  held(): Held { return this.state; }

  drainActions(): ActionsWithPause {
    const out = this.pending;
    this.pending = { rotCW: false, rotCCW: false, hard: false, hold: false, pause: false, start: false };
    return out;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
