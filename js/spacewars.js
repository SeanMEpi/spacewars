document.getElementById("ship").style.display = "none";
document.getElementById("starfield").style.display = "none";

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var canvasW = window.innerWidth;
var canvasH = window.innerHeight;
function drawBackground() {
  context.fillStyle = "#000000";
  context.fillRect(0,0,canvasW,canvasH);
  var backgroundImage = document.getElementById("starfield");
  context.drawImage(backgroundImage, 0, 0, canvasW, canvasH);
};

var Ship = function Ship() {
  this.image = document.getElementById("ship");
  this.drawRotatedImage = function(x, y, angle, w, h) {
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.drawImage(this.image, -(w / 2), -(h / 2), canvasH / 20, canvasW / 25);
    context.restore();
  };
};
var testShip = new Ship();

drawBackground();
testShip.drawRotatedImage((canvasW * .10), (canvasH * .10), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .20), (canvasH * .20), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .30), (canvasH * .30), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .40), (canvasH * .40), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .50), (canvasH * .50), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .60), (canvasH * .60), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .70), (canvasH * .70), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .80), (canvasH * .80), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .90), (canvasH * .90), 0, canvasH / 20, canvasW / 25);


