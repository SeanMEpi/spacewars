document.getElementById("ship").style.display = "none";

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var canvasW = window.innerWidth;
var canvasH = window.innerHeight;
function drawBackground() {
  context.fillStyle = "#000000";
  context.fillRect(0,0,canvasW,canvasH);
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
testShip.drawRotatedImage((canvasW * .100), (canvasH * .500), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .101), (canvasH * .501), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .102), (canvasH * .502), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .103), (canvasH * .503), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .104), (canvasH * .504), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .105), (canvasH * .505), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .106), (canvasH * .506), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .107), (canvasH * .507), 0, canvasH / 20, canvasW / 25);
testShip.drawRotatedImage((canvasW * .108), (canvasH * .508), 0, canvasH / 20, canvasW / 25);


