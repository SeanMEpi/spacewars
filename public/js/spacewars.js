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
    ship0.drawRotatedImage(s1_x, s1_y, s1_angle, canvasW / 25, canvasH / 20);
    ship1.drawRotatedImage(s2_x, s2_y, s2_angle, canvasW / 25, canvasH / 20);
  };

  ship0 = new Ship();
  ship1 = new Ship();

  var clientId = '';
  var socket = io();
  socket.on('client ID', function(msg) {
    if (clientId === '') {
      clientId = msg;
      console.log('client ID: ' + clientId);
    };
  });
  socket.on('server message', function(msg) {
    console.log('Server message: ' + msg);
  });
  socket.on('server frame', function(msg) {
    var rxParams = msg.split(' ');
    drawFrame(parseFloat(rxParams[0]) * canvasW, parseFloat(rxParams[1]) * canvasH, parseFloat(rxParams[2]),
              parseFloat(rxParams[3]) * canvasW, parseFloat(rxParams[4]) * canvasH, parseFloat(rxParams[5]));
  });
  window.addEventListener('keydown',function(e) {
    txMsg = clientId + ' ' + e.keyCode;
    socket.emit('client keydown', txMsg);
  },true);
  window.addEventListener('keyup',function(e) {
    txMsg = clientId + ' ' + e.keyCode;
    socket.emit('client keyup', txMsg);
  },true);

});
