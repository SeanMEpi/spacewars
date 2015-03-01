$.getScript("/socket.io/socket.io.js", function() {

  document.getElementById("ship").style.display = "none";
  document.getElementById("shipExp0").style.display = "none";
  document.getElementById("shipExp1").style.display = "none";
  document.getElementById("shipExp2").style.display = "none";
  document.getElementById("shipExp3").style.display = "none";
  document.getElementById("shipExp4").style.display = "none";
  document.getElementById("shipExp5").style.display = "none";
  document.getElementById("shipExp6").style.display = "none";
  document.getElementById("shipExp7").style.display = "none";
  document.getElementById("shipExp8").style.display = "none";
  document.getElementById("shipExp9").style.display = "none";
  document.getElementById("shipExp10").style.display = "none";
  document.getElementById("shipExp11").style.display = "none";
  document.getElementById("shipExp12").style.display = "none";
  document.getElementById("shipExp13").style.display = "none";
  document.getElementById("shipExp14").style.display = "none";
  document.getElementById("shipExp15").style.display = "none";
  document.getElementById("shipExp16").style.display = "none";
  document.getElementById("shipExp17").style.display = "none";
  document.getElementById("shipExp18").style.display = "none";
  document.getElementById("shipExp19").style.display = "none";
  document.getElementById("shipExp20").style.display = "none";
  document.getElementById("shipExp21").style.display = "none";
  document.getElementById("shipExp22").style.display = "none";
  document.getElementById("shipExp23").style.display = "none";

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

  function drawRotatedImage(x, y, angle, w, h, image) {
    var thisImage = document.getElementById(image);
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.drawImage(thisImage, -(w / 2), -(h / 2), w, h);
    context.restore();
  };

  function drawFrame(params) {
    drawBackground();
    for (i=0; i<params.length; i=i+4) {
      drawRotatedImage(parseFloat(params[i]) * canvasW, parseFloat(params[i+1]) * canvasH,
                       parseFloat(params[i+2]), canvasW / 25, canvasH / 20, params[i+3]);
    };
  };

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
    drawFrame(rxParams);
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
