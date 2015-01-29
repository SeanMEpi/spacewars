$.getScript("/socket.io/socket.io.js", function() {

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

  function Ship() {
    this.image = document.getElementById("ship");
    // w & h refer to size of image; the ship images are being scaled to the canvas size
    this.drawRotatedImage = function(x, y, angle, w, h) {
      context.save();
      context.translate(x, y);
      context.rotate(angle);
      context.drawImage(this.image, -(w / 2), -(h / 2), canvasW / 25, canvasH / 20);
      context.restore();
    };
  };

  function drawFrame(s1_x, s1_y, s1_angle, s2_x, s2_y, s2_angle) {
    drawBackground();
    ship1.drawRotatedImage(s1_x, s1_y, s1_angle, canvasW / 25, canvasH / 20);
    ship2.drawRotatedImage(s2_x, s2_y, s2_angle, canvasW / 25, canvasH / 20);
  };

  ship1 = new Ship();
  ship2 = new Ship();

  var socket = io();
  socket.on('server message', function(msg) {
    console.log('Server message: ' + msg);
  });
  socket.on('server frame', function(msg) {
    var params = msg.split(" ");
    drawFrame(parseFloat(params[0]) * canvasW, parseFloat(params[1]) * canvasH, parseFloat(params[2]),
              parseFloat(params[3]) * canvasW, parseFloat(params[4]) * canvasH, parseFloat(params[5]));
  });
  window.addEventListener('keydown',function(e) {
    socket.emit('client keydown', e.keyCode);
  },true);
  window.addEventListener('keyup',function(e) {
    socket.emit('client keyup', e.keyCode);
  },true);

});
