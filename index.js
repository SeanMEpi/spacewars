var express = require('express'),
app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname + '/public'));

var ships = [];
function Ship() {
  this.socketId = 0;
  this.keyState = [];
  this.x = 0; // absolute position (.000 to .999)
  this.y = 0; // absolute position (.000 to .999)
  this.direction = 0; // radians
  this.alive = true;
  this.vector = [0,0]; // x & y
  this.setPosition = function(x,y) {
    this.x = x;
    this.y = y;
  };
  this.setDirection = function(direction) {
    this.direction = direction;
  };
  this.resetVector = function() {
    this.vector[0] = 0;
    this.vector[1] = 0;
  };
  this.addVector = function(direction, impulse) {
    xToAdd = impulse * Math.cos(direction);
    yToAdd = impulse * Math.sin(direction);
    this.vector[0] += xToAdd;
    this.vector[1] += yToAdd;
  };
  this.rotate = function(amount) {
    this.direction += amount;
  };
  this.newPosition = function() {
    this.x = this.x + this.vector[0];
    this.y = this.y + this.vector[1];
  };
};

ships[0] = new Ship();
ships[1] = new Ship();

io.on('connection', function(socket) {
  var set = false;
  if (ships[0].socketId === 0) {
    ships[0].socketId = socket.id;
    ships[0].setPosition(.100, .500);
    ships[0].setDirection(0);
    ships[0].resetVector();
    console.log('client connect: ' + socket.id);
    io.emit('client ID', ships[0].socketId);
    set = true;
  };
  if ((ships[1].socketId === 0) && (!set)) {
    ships[1].socketId = socket.id;
    ships[1].setPosition(.900, .500);
    ships[1].setDirection(Math.PI);
    ships[1].resetVector();
    console.log('client connect: ' + socket.id);
    io.emit('client ID', ships[1].socketId);
  };

  socket.on('disconnect', function() {
    for (i=0; i<ships.length; i++) {
      if (ships[i].socketId === socket.id) {
        ships[i].socketId = 0;
        console.log('client disconnect: ' + socket.id);
      };
    };
  });

  socket.on('client keydown', function(msg) {
    var rxParams = msg.split(' ');
    var rxID = rxParams[0];
    var rxKeydown = rxParams[1];
    console.log('client: ' + rxID + ' ' + 'keydown: ' + rxKeydown);
    for (i=0;i<ships.length;i++) {
      if (rxID === ships[i].socketId) {
        ships[i].keyState[rxKeydown] = true;
        console.log('client: ' + rxID + ' ' + 'keystate: ' + ships[i].keyState);
      };
    };
  });
  socket.on('client keyup', function(msg) {
    var rxParams = msg.split(' ');
    var rxID = rxParams[0];
    var rxKeyup = rxParams[1];
    console.log('client: ' + rxID + ' ' + 'keyup: ' + rxKeyup);
    for (i=0;i<ships.length;i++) {
      if (rxID === ships[i].socketId) {
        ships[i].keyState[rxKeyup] = false;
        console.log('client: ' + rxID + ' ' + 'keystate: ' + ships[i].keyState);
      };
    };
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});

function update() {
  if (ships[0] && ships[1]) {  // don't run until clients are connected
    updateClients();
    txFrame(ships[0].x, ships[0].y, ships[0].direction, ships[1].x, ships[1].y, ships[1].direction);
  };
};

function txFrame(s1_x, s1_y, s1_angle, s2_x, s2_y, s2_angle) {
  var txMsg = s1_x.toString() + ' ' + s1_y.toString() + ' ' + s1_angle.toString() + ' ' +
              s2_x.toString() + ' ' + s2_y.toString() + ' ' + s2_angle.toString();
  io.emit('server frame', txMsg);
};

function updateClients() {
  for (i=0; i<ships.length; i++) {
    if (ships[i].keyState[65]) {
      ships[i].rotate(-Math.PI / 32);
      console.log('client: ' + ships[i].socketId + ' rotate counterclockwise');
    };
    if (ships[i].keyState[68]) {
      ships[i].rotate(Math.PI / 32);
      console.log('client: ' + ships[i].socketId + ' rotate clockwise');
    };
    if (ships[i].keyState[87]) {
      ships[i].addVector(ships[i].direction, .001);
      console.log('client: ' + ships[i].socketId + ' thrust');
    };
    if (ships[i].keyState[74]) {
      console.log('client: ' + ships[i].socketId + ' fire');
    };
    ships[i].newPosition();
  };
};

setInterval( function() { update(); }, 1000/60);



