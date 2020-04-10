import Sprite from './sprite';

const lifeImg = new Image();
lifeImg.src = "./assets/images/turbo.png";

const redBox = new Image();
redBox.src = "./assets/images/redbox.png";

class Life {
  constructor(physics) {
    this.physics = physics;
    this.sprite = new Sprite(lifeImg, 30, 31,1.5,1.5);
    this.box = new Sprite(redBox,40,50,1.5,1.5)
    this.marked = true;
  }

  move() {
    this.physics.dDown = this.physics.speed;
  }

  stop() {
    this.physics.dDown = 0;
  }
}

export default Life;