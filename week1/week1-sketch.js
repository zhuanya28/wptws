let circles = [];


function setup() {
  createCanvas(800, 800);
  let standardInc = PI / 2000;

  let numOfRows = 6;

  for (let j = 0; j < numOfRows; j++) {
    let numOfCirclesInRow = (j + 1) *5;
    for (let i = 0; i < numOfCirclesInRow; i++) {
      circles.push(
        new Circle(
          (j + 1) * 50,
          (2 * PI) / numOfCirclesInRow * (i + 1),
          "r",
          "w",
          standardInc
        )
      );
    }

    for (let i = 0; i < numOfCirclesInRow; i++) {
      circles.push(
        new Circle(
          (j + 1) * 50,
          (2 * PI) / numOfCirclesInRow * (i + 1),
          "l",
          "b",
          standardInc
        )
      );
    }
  }
}

function draw() {
  background(40, 45, 46);
  circles.forEach((oneCircle) => {
    oneCircle.drawCircle();
    oneCircle.update();
  });
}

class Circle {
  constructor(
    radius,
    startingAngle,
    direction,
    colorS = "w",
    increment = PI / 1000
  ) {
    this.angle = startingAngle;
    this.radius = radius;
    this.position = p5.Vector.fromAngle(this.angle).mult(radius);
    this.increment = increment;
    this.direction = direction;
    this.size = 30;
    this.size = map(radius, 0, width / 2, 20, 40);
    if (colorS == "w") {
      this.color = color(255, 200, 0);
    } else {
      this.color = color(40, 45, 46);
    }
  }

  drawCircle() {
    push();
    translate(width / 2, height / 2);
    noStroke();
      fill(this.color);
    

    circle(this.position.x, this.position.y, this.size);
    pop();
  }

  update() {
    if (this.direction == "r") {
      this.angle += this.increment;
    } else if (this.direction == "l") {
      this.angle -= this.increment;
    }
    this.position = p5.Vector.fromAngle(this.angle).mult(this.radius);
  }
}

