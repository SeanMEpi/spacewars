var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var canvasW = window.innerWidth;
var canvasH = window.innerHeight;

function drawRotatedImage(image, x, y, angle) {

  // save the current co-ordinate system
  // before we screw with it
  context.save();

  // move to the middle of where we want to draw our image
  context.translate(x, y);

  // rotate around that point, converting our
  // angle from degrees to radians
  context.rotate(angle);

  // draw it up and to the left by half the width
  // and height of the image
  context.drawImage(image, -(2 * image.width), -(2 * image.height));

  // and restore the co-ords to how they were when we began
  context.restore();
};

var testImage = document.getElementById("ship");

drawRotatedImage(testImage, (canvasW * .5), (canvasH * .5), 0);
drawRotatedImage(testImage, (canvasW * .5), (canvasH * .5), Math.PI / 2);
drawRotatedImage(testImage, (canvasW * .5), (canvasH * .5), Math.PI);
drawRotatedImage(testImage, (canvasW * .5), (canvasH * .5), 3 * Math.PI / 2);


