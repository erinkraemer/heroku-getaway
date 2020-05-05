// import GameView from './game_view.js';
// import Car from './car.js';
// import { request } from 'http';
import Road from './road.js';
import Life from './life.js';
import Util from './util.js';
import Obstacle from './obstacle.js';
import Physics from './physics.js';
import Cash from './cash.js';
import Car from './car.js';
import assets from './assets.js';
const lifeImgFolder = "./assets/images/life/";
const obstacleImgFolder = "./assets/images/obstacle/";
const moneyImgFolder = "./assets/images/money/";
var ctr = 0;
const T_width = (70+50)/2+15; //car width/2 + obstacle width/2 + small const: Used for avoiding obstacles
const R_l = 150; // road lb in x; //100 pixels on each side for dead zone?
const R_u = 350; // road ub in x;
const Kp_obs = 0.03; //Kp for x-tracker on car for obstacle avoidance
const Kp_getter = 0.01; //Kp for x-tracker on car to get life or cash
const obj_buf = 75; //constant for when object goes behind car (1/2 of car len)
const OBJECTTYPE = Object.freeze({ "obstacle": "O", "cash": "C", "life": "L" });

function indexOfSmallest(a) {
 var lowest = 0;
 for (var i = 1; i < a.length; i++) {
  if (a[i] < a[lowest]) lowest = i;
 }
 return lowest;
}

class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.gameOver = false;
    this.rocks = [];
    this.life = [];
    this.cash = [];
    this.boxed = [];
    this.assets = assets();
    this.animate = null;
    this.lifeImgSrc = "./assets/images/life/life (1).png";
    this.rockImgSrc = "./assets/images/obstacle/obstacle (1).png";
    this.moneyImgSrc = "./assets/images/money/money (1).png";
    this.lifeImgLists = [];
    this.moneyImgLists = [];
    this.obstacleImgLists = [];
    this.numImgs = 16;
    this.assetidCounter = -1;


    for (var i = 0; i < this.numImgs; i++) {
      this.lifeImgLists.push(lifeImgFolder + "life (" + (i + 1).toString() + ").png");
      this.moneyImgLists.push(moneyImgFolder + "money (" + (i + 1).toString() + ").png");
      this.obstacleImgLists.push(obstacleImgFolder + "obstacle (" + (i + 1).toString() + ").png");
    }
    document.getElementById("obstacle").style["background-image"] = "url(\'" + this.rockImgSrc + "\')";
    document.getElementById("money").style["background-image"] = "url(\'" + this.moneyImgSrc + "\')";
    document.getElementById("life").style["background-image"] = "url(\'" + this.lifeImgSrc + "\')";
  }
  blinkCanvas(blinkRate, blinkDuration,color) {
    var interval = window.setInterval(function () {
      if (document.getElementById("canvas").style["border"] != "20px solid "+color) {
        document.getElementById("canvas").style["border"] = "20px solid "+color;
      } else {
        document.getElementById("canvas").style["border"] = "20px solid black";
      }
    }, blinkRate);

    setTimeout(function (y) {
      document.getElementById("canvas").style["border"] = "20px solid black";
      clearInterval(y);
    }, blinkDuration, interval);
}
  checkUserResponse(i) {
    if (this.boxed.length > 0) {
          if (this.boxed[0][0] == i) {
              //Blink green
            //document.getElementById("canvas").style["border"] = "20px solid green";
            this.blinkCanvas(200, 2000,"green");

          }
          else {
            //Blink red
            //document.getElementById("canvas").style["border"] = "20px solid red";
            this.blinkCanvas(200, 2000, "red");
          }
      }
  }



  // hit detection for objects
  static checkCollision(car, object, array, assets,boxed) {
    if (object instanceof Obstacle) {
      if (Util.collide_with_scale(car, object)) {
        car.hitObstacle();
        car.makeRed();
        array.splice(array.indexOf(object), 1);
        console.log("Before removing");
        console.log(boxed);
        console.log(object.assetid);
        if (boxed.indexOf(object.assetid) != -1) {
          boxed.splice(boxed.indexOf(object.assetid), 1);
        }
        console.log("After removing");
        console.log(boxed);
        console.log(object.assetid);
      }
    }
    if (object instanceof Life) {
      if (Util.collide_with_scale(car, object)) {
        car.getLife();
        car.makeGreen();
        array.splice(array.indexOf(object), 1);
        console.log("Before removing");
        console.log(boxed);
        console.log(object.assetid);
        if (boxed.indexOf(object.assetid) != -1) {
          boxed.splice(boxed.indexOf(object.assetid), 1);
        }
        console.log("After removing");
        console.log(boxed);
        console.log(object.assetid);
      }
    }
    if (object instanceof Cash) {
      if (Util.collide_with_scale(car, object)) {
        assets.road.score += 100;
        assets.road.makeGreen();
        array.splice(array.indexOf(object), 1);
        console.log("Before removing");
        console.log(boxed);
        console.log(object.assetid);
        if (boxed.indexOf(object.assetid) != -1) {
          boxed.splice(boxed.indexOf(object.assetid), 1);
        }
        console.log("After removing");
        console.log(boxed);
        console.log(object.assetid);
      }
    }
  }
  obstacleProbablityFunction() {
    return (Math.random() > 0.5);
  }

  moneyProbablityFunction() {
    return (Math.random() > 0.5);
  }

  lifeProbablityFunction() {
    return (Math.random() > 0.5);
  }
  obstacleBoxProbablityFunction() {
    return (Math.random() > 0.5);
  }

  moneyBoxProbablityFunction() {
    return (Math.random() > 0.5);
  }

  lifeBoxProbablityFunction() {
    return (Math.random() > 0.5);
  }

  
  // checks if item passed canvas height to delete
  static checkCanvas(object, array, boxed) {

    if (object instanceof Life) {
      
      if (object.physics.y > canvas.height) {
        array.splice(array.indexOf(object), 1);
        if (boxed.indexOf(object.assetid) != -1){
          boxed.splice(boxed.indexOf(object.assetid), 1);
         }
      }
    }
    if (object instanceof Obstacle) {
      
      if (object.physics.y > canvas.height) {
        array.splice(array.indexOf(object), 1);
        if (boxed.indexOf(object.assetid) != -1) {
          boxed.splice(boxed.indexOf(object.assetid), 1);
        }
      }
    }
    if (object instanceof Cash) {
      
      if (object.physics.y > canvas.height) {
        array.splice(array.indexOf(object), 1);
        if (boxed.indexOf(object.assetid) != -1) {
          boxed.splice(boxed.indexOf(object.assetid), 1);
        }
      }
    }
    // console.log("After removing");
    // console.log(boxed);
  }

  drawAsset(asset) {
    const { physics, sprite, box, marked, distance } = asset;

    // redraw road
    if (asset instanceof Road && asset.physics.y >= 0) {
      if (sprite.height > canvas.height) {
        if (asset.physics.y > (canvas.height)) {
          asset.physics.y = canvas.height - sprite.height;
        }

        this.ctx.drawImage(sprite.img, 0, 0, sprite.width, sprite.height, asset.physics.x, asset.physics.y - sprite.height + 1, sprite.width, sprite.height);
      }
    }

    // draw more rocks
    if (asset instanceof Obstacle && asset.physics.y >= 0) {
      if (asset.physics.y > canvas.height) {
        this.ctx.drawImage(sprite.img, 0, 0, sprite.width, sprite.height, asset.physics.x, asset.physics.y - 900, sprite.width * sprite.width_scale, sprite.height * sprite.height_scale);
        //console.log("Drawing rock");

        // if(marked){
        //   //this.ctx.drawImage(box.img, 0, 0, box.width, box.height, asset.physics.x, asset.physics.y - 900, box.width*sprite.width_scale, box.height*sprite.height_scale);
        //   this.ctx.drawImage(box.img, 0, 0, box.width, box.height, asset.physics.x+0.5*(sprite.width*sprite.width_scale-box.width*sprite.width_scale), asset.physics.y - 900 + 0.5*(sprite.height*sprite.height_scale - box.height*box.height_scale), box.width*box.width_scale, box.height*box.height_scale);
        // }
      }
    }

    if (asset instanceof Car) {
      // this.ctx.drawImage(sprite.img,
      //   0, 0, sprite.width, sprite.height,
      //   physics.x, physics.y, sprite.width, sprite.height);
      asset.draw(this.ctx);
    } else {
      // draw everything else
      this.ctx.drawImage(sprite.img, 0, 0, sprite.width, sprite.height,
        physics.x, physics.y, sprite.width * sprite.width_scale, sprite.height * sprite.height_scale);
      if (marked &&  physics.y>distance*this.canvas.height) {

          //this.ctx.drawImage(box.img, 0, 0, box.width, box.height, physics.x, physics.y, box.width*sprite.width_scale, box.height*sprite.height_scale);
        

       
            if (this.boxed.indexOf(asset.assetid) == -1) {
            // console.log("After adding");
              if (this.boxed.length == 0){
                this.boxed.push(asset.assetid);
                this.blinkCanvas(200, 800, "blue");
              }
            // console.log(this.boxed);
            }
            else {
              this.ctx.drawImage(box.img, 0, 0, box.width, box.height, physics.x + 0.5 * (sprite.width * sprite.width_scale - box.width * box.width_scale), asset.physics.y + 0.5 * (sprite.height * sprite.height_scale - box.height * box.height_scale), box.width * box.width_scale, box.height * box.height_scale);
            }

        }
    }



    // update position of all objects
    if (this.assets.car.life != 0) {
      if (asset instanceof Car) {
        physics.boundedUpdate();
      } else {
        physics.updatePosition();
      }
    }
  }

  randomizesprite() {
    var rnd1 = Math.floor(Math.random() * Math.floor(this.numImgs));
    var rnd2 = Math.floor(Math.random() * Math.floor(this.numImgs));
    var rnd3 = Math.floor(Math.random() * Math.floor(this.numImgs));
    this.lifeImgSrc = this.lifeImgLists[rnd1];
    this.moneyImgSrc = this.moneyImgLists[rnd2];
    this.rockImgSrc = this.obstacleImgLists[rnd3];
    //console.log(this.lifeImgSrc);
    // this.rocks.forEach(el => {
    //   el.updatesprite(this.rockImgSrc);
    // })
    // this.life.forEach(el => {
    //   el.updatesprite(this.lifeImgSrc);
    // })
    // this.cash.forEach(el => {
    //   el.updatesprite(this.moneyImgSrc);
    // })
    //document.getElementById("obstacle").style["background-image"] = "url(+\'" +"../images/life/life (1).png"+"\')";
    document.getElementById("obstacle").style["background-image"] = "url(\'" + this.rockImgSrc + "\')";
    document.getElementById("money").style["background-image"] = "url(\'" + this.moneyImgSrc + "\')";
    document.getElementById("life").style["background-image"] = "url(\'" + this.lifeImgSrc + "\')";
  }

  draw() {
    if (!this.gameOver) {
      const animate = () => {
        const assets = Object.values(this.assets);
        this.animate = requestAnimationFrame(animate);
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < assets.length; i++) {
          this.drawAsset(assets[i]);
        }

        // check collision for rocks
        this.rocks.forEach(el => {
          Game.checkCollision(this.assets.car, el, this.rocks,this.assets,this.boxed);
          Game.checkCanvas(el, this.rocks, this.boxed);
        })

        // check collision for life

        this.life.forEach(el => {
          Game.checkCollision(this.assets.car, el, this.life,this.assets,this.boxed);
          Game.checkCanvas(el, this.life,this.boxed);
        })

        // check collision for life
        this.cash.forEach(el => {
          Game.checkCollision(this.assets.car, el, this.cash, this.assets,this.boxed);
          Game.checkCanvas(el, this.cash,this.boxed);
        })

        this.life.forEach(el => {
          this.drawAsset(el);
          el.move();
        });

        this.rocks.forEach(el => {
          this.drawAsset(el);
          el.move();
        })

        this.cash.forEach(el => {
          this.drawAsset(el);
          el.move();
        })

        // render score and lives
        this.assets.road.addScore();
        // document.getElementById("score").innerHTML = `${this.assets.road.score}`;
        // document.getElementById("lives").innerHTML = `${this.assets.car.life}`;
        this.end();
      }

      animate();
    }
  }

  end() {
    if (this.assets.car.life <= 0) {
      this.gameOver = true;
      this.assets.road.stop();
      this.draw();
      document.getElementById("slow").innerHTML = `Too Slow!`;
      document.getElementById("how").style.visibility = "hidden";
      document.getElementById("welcome").style.display = null;
    }
  }

  createRock(bool_marked) {

    this.rocks.push(new Obstacle(new Physics(
      Math.floor(Math.random() * 310) + 80,
      -20),this.rockImgSrc,true,("O"+(++this.assetidCounter).toString()), 0.3
    ));
    
  };

  createLife(bool_marked) {
    this.life.push(new Life(new Physics(
      Math.floor(Math.random() * 310) + 80,
      -20), this.lifeImgSrc, true, ("L" + (++this.assetidCounter).toString()),0.3
    ));
    
  };

  createCash(bool_marked) {
    this.cash.push(new Cash(new Physics(
      Math.floor(Math.random() * 310) + 80,
      -20), this.moneyImgSrc, true, ("C" + (++this.assetidCounter).toString()),0.3
    ));
    
  };

  cleanUp() {
    // clearInterval(this.create);
    window.cancelAnimationFrame(this.animate);
  }

  releaseControls() {
    // set controls to zero to mimic  key release (0-order hold)
    //console.info("Controls: Release")
    this.assets.car.physics.dLeft=0;
    this.assets.car.physics.dRight=0;
    this.assets.car.physics.dUp=0;
    this.assets.car.physics.dDown=0;
  }

  moveLeft(u) {
  //move car left by u
  this.assets.car.physics.dLeft=u;
  }

  moveRight(u) {
  //move car left by u
  this.assets.car.physics.dRight=u;
  }

  closestObject() {
    //returns type of object closest to car (in front)
    // 0: cash, 1: rock, 2: life, 3: no spawned object ahead

    var y_cash;
    var y_rocks;
    var y_life;
    //console.info("Trying to find closest obj type")
    if(this.cash && this.cash.length>0) //check Cash
    {      y_cash = this.cash[0].physics.y;     }//of the oldest cash created
      else {y_cash = -10000;} //a number that places it far away

    if(this.rocks && this.rocks.length>0) //check Rock
    {          y_rocks = this.rocks[0].physics.y;     }
      else {y_rocks = -10000;} //a number that places it far away

    if(this.life && this.life.length>0) //check life
    {          y_life = this.life[0].physics.y;     }
      else {y_life = -10000;} //a number that places it far away

    var y_car = this.assets.car.physics.y;
    var dists_y = [10000*((y_car-y_cash)<=-obj_buf)+(y_car-y_cash)*((y_car-y_cash)>-obj_buf),
                   10000*((y_car-y_rocks)<=-obj_buf)+(y_car-y_rocks)*((y_car-y_rocks)>-obj_buf),
                   10000*((y_car-y_life)<=-obj_buf)+(y_car-y_life)*((y_car-y_life)>-obj_buf),
                 ]; //if object is behind var, make this a large positive value
    var ix_min = indexOfSmallest(dists_y);
   //console.info("Controls: Closest type: ",ix_min);
   //console.info("Controls: Distance in y = ",dists_y[ix_min]);

   if(dists_y[ix_min]>10000) //no spawned object ahead
   {return 3;}
   else {return ix_min;} //else return type of object ahead

 } //end of closestObject


rockAvoider() {
  var Cx = this.assets.car.physics.x;
  var Ox = this.rocks[0].physics.x; //x of nearest rock
  var x_ref = Cx;
  if(Math.abs(Ox-Cx) >= T_width)
  {
    //don't move
    x_ref = Cx;
    console.info("Decision: Not moving, obs diff x= ",Ox-Cx, "T_width=",T_width);
  }
  else { //got to move
    if(Ox>=Cx){ //obstacle on right
      if(Cx-R_l>=T_width-(Ox-Cx)){ //room on left?
        x_ref = Ox-T_width;
        console.info("Decision: Obs right, Going from left of obstacle ");
      }
      else{ //no room on left
        x_ref = Ox+T_width;
        console.info("Decision: Obs right, Going from right of obstacle ");
      }
    } //end if Ox>=Cx
    else //obstacle on left
    { //if Ox<Cx
      if(R_u-Cx > T_width-(Cx-Ox)) //room on right?
      {
        x_ref = Ox+T_width;
        console.info("Decision: Obs left, Going from right of obstacle ");
      }
      else //no room on right
      {
        x_ref = Ox-T_width;
        console.info("Decision: Obs left, Going from left of obstacle ");
      }
    } //end of else obstacle on left
  } //end of else got to move
// take action
var err_x = x_ref-Cx;
  if(err_x>0)
  {
      this.moveRight(Kp_obs*err_x);
      console.info("Controls: Right, ref = ",x_ref, "err=",err_x);
  }
  else if(err_x<0) //0 is to not move
  {
      this.moveLeft(-Kp_obs*err_x);
      console.info("Controls: Left, ref = ",x_ref, "err=",err_x);
  }

} //end of rock avoider

objectGetter(o_type) {
  if(o_type==0) //Cash
  {
    var x_ref = this.cash[0].physics.x;
  }
  else if(o_type==2) //life
  {
    var x_ref = this.life[0].physics.x;
  }
  var err_x = x_ref - this.assets.car.physics.x;
  if(err_x>=0)
      {
      //console.info("Controls: Going right");
      this.moveRight(Kp_getter*err_x);
      }
  else
      {
      //console.info("Controls: Going left");
      this.moveLeft(-Kp_getter*err_x);
      }


} //end of object getter

moveRandom(step){
  //move randomly

     if(Math.random() >= 0.5)
     {
     console.info("Controls: ","Random Left");
     this.moveLeft(step);
     }
     else
     {
     console.info("Controls: ","Random Right");
     this.moveRight(step);
     }
} //end move random

  start() {
    this.gameOver = false;
    document.getElementById("welcome").style.display="none";
    this.assets.car.resetLife();

    setInterval(() => {
      if (!this.gameOver) {
        var boxEmpty = Array.isArray(this.boxed) && !this.boxed.length;
        if(ctr%3 == 0)
        {
          this.createRock( boxEmpty && this.obstacleBoxProbablityFunction());
        }
        else if(ctr%3==1){
          this.createCash(boxEmpty &&this.moneyBoxProbablityFunction());
        }
        else if(ctr%3==2){
          this.createLife(boxEmpty &&this.lifeBoxProbablityFunction());
        }
        ctr++;

      }
    }, 5000);

    setInterval(() => {
      this.randomizesprite();
    }, 21000); //what is the right interval for this?


//--------------------AI agent---------------------
    setInterval(() => { //controls
    this.releaseControls(); //zero-order hold (release key)
    var closestObjectType;
    closestObjectType = this.closestObject(); //get type of object that is closest
    console.info("Controls: Closest object type = ",closestObjectType);

    // Add a flag for answered or not (and lower it) and execute control code
    // only if the object has been recognized. Lower flag when done tracking.

    //rock  avoider
    if(closestObjectType==1) //obstacle
    {
      this.rockAvoider();
    }
    else if(closestObjectType==0 || closestObjectType==2) //object to get
    {
      this.objectGetter(closestObjectType);
    }
    else
    {
      this.moveRandom(0.5);
    }
  }, 1000); //every 1s

//-----------------end AI agent code---------------

    this.draw();
    this.assets.road.move();

  }


}

export default Game;
