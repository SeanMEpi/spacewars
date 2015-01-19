document.getElementById("ship").style.display = "none";
document.getElementById("explosion").style.display = "none";

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var canvasW = window.innerWidth;
var canvasH = window.innerHeight;

var Ship = function Ship() {
  this.image = document.getElementById("ship");
  this.drawRotatedImage = function(x, y, angle) {
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.drawImage(this.image, -(.5 * this.image.width), -(.5 * this.image.height));
    context.restore();
  };
};
var testShip = new Ship();

testShip.drawRotatedImage((canvasW * .5), (canvasH * .5), 0);
testShip.drawRotatedImage((canvasW * .5), (canvasH * .5), Math.PI / 2);
testShip.drawRotatedImage((canvasW * .5), (canvasH * .5), Math.PI);
testShip.drawRotatedImage((canvasW * .5), (canvasH * .5), 3 * Math.PI / 2);



