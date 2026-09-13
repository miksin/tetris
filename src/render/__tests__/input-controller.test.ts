// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { InputController } from '../input-controller';

function press(code: string, down: boolean) {
  window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code }));
}

describe('InputController', () => {
  it('hold flags reflect arrow keys; release clears', () => {
    const c = new InputController();
    press('ArrowLeft', true);
    expect(c.held().left).toBe(true);
    press('ArrowLeft', false);
    expect(c.held().left).toBe(false);
    c.destroy();
  });

  it('action flags fire once on keydown, not on repeat semantics of keyup', () => {
    const c = new InputController();
    press('Space', true);
    expect(c.drainActions().hard).toBe(true);
    expect(c.drainActions().hard).toBe(false);
    c.destroy();
  });

  it('rotation mapping: X CW, Z CCW, C hold', () => {
    const c = new InputController();
    press('KeyX', true); expect(c.drainActions().rotCW).toBe(true);
    press('KeyZ', true); expect(c.drainActions().rotCCW).toBe(true);
    press('KeyC', true); expect(c.drainActions().hold).toBe(true);
    c.destroy();
  });

  it('pause action from P or Escape', () => {
    const c = new InputController();
    press('KeyP', true); expect(c.drainActions().pause).toBe(true);
    press('Escape', true); expect(c.drainActions().pause).toBe(true);
    c.destroy();
  });

  it('destroy() stops listening', () => {
    const c = new InputController();
    c.destroy();
    press('ArrowLeft', true);
    expect(c.held().left).toBe(false);
  });
});
