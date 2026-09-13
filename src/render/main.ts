import Phaser from 'phaser';
import { Game } from '../core/game';
import { BoardScene } from './board-scene';
import { InputController } from './input-controller';

const game = new Game();
const controller = new InputController();
const scene = new BoardScene(game, controller);

new Phaser.Game({
  type: Phaser.AUTO,
  width: 720,
  height: 720,
  backgroundColor: 0x111111,
  scene: [scene],
});
