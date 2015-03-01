var express = require('express'),
app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname + '/public'));

var framerate = 60; // frames per second

var objects = [];
var clients = [];
function Thing() {
  this.socketId = 0;
  this.keyState = [];
  this.x = 0; // absolute position (.000 to .999)
  this.y = 0; // absolute position (.000 to .999)
  this.direction = 0; // radians
  this.defaultDirection = 0;
  this.alive = true;
  this.vector = [0,0]; // x & y
  this.velocityLimit = 0.02;
  this.radius = .06; // collision detection radius
  this.defaultImage = 'ship';
  this.currentImage = 'ship';
  this.explosion = [500, 'shipExp0', 125, 'shipExp1', 250, 'shipExp2', 375, 'shipExp3', 500];
  this.explosionTimer = 0;
  this.explosionFrameCounter = 1;
  this.exploding = false;
  this.defaultX = 0;
  this.defaultY = 0;
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
    // velocity limit
    if ((Math.abs(this.vector[0]) >= this.velocityLimit) && (this.vector[0] >= 0)) {
      this.vector[0] = this.velocityLimit;
    };
    if ((Math.abs(this.vector[0]) >= this.velocityLimit) && (this.vector[0] <= 0)) {
      this.vector[0] = -1 * this.velocityLimit;
    };
    if ((Math.abs(this.vector[1]) >= this.velocityLimit) && (this.vector[1] >= 0)) {
      this.vector[1] = this.velocityLimit;
    };
    if ((Math.abs(this.vector[1]) >= this.velocityLimit) && (this.vector[1] <= 0)) {
      this.vector[1] = -1 * this.velocityLimit;
    };
  };
  this.rotate = function(amount) {
    this.direction += amount;
  };
  this.newPosition = function() {
    this.x = this.x + this.vector[0];
    this.y = this.y + this.vector[1];
    // screen wraparound
    if (this.x <= 0) {
      this.x = .998;
    };
    if (this.x >= .999) {
      this.x = 0;
    };
    if (this.y <= 0) {
      this.y = .998;
    };
    if (this.y >= .999) {
      this.y = 0;
    };
  };
};

clients[0] = new Thing(); // player ship
clients[1] = new Thing(); // player ship

io.on('connection', function(socket) {
  var set = false;
  if (clients[0].socketId === 0) {
    clients[0].socketId = socket.id;
    clients[0].defaultX = .100;
    clients[0].defaultY = .500;
    clients[0].setPosition(clients[0].defaultX, clients[0].defaultY);
    clients[0].defaultDirection = 0;
    clients[0].setDirection(clients[0].defaultDirection);
    clients[0].resetVector();
    console.log('client connect: ' + socket.id);
    io.emit('client ID', clients[0].socketId);
    set = true;
  };
  if ((clients[1].socketId === 0) && (!set)) {
    clients[1].socketId = socket.id;
    clients[1].defaultX = .900;
    clients[1].defaultY = .500;
    clients[1].setPosition(clients[1].defaultX, clients[1].defaultY);
    clients[1].defaultDirection = Math.PI;
    clients[1].setDirection(clients[1].defaultDirection);
    clients[1].resetVector()
    console.log('client connect: ' + socket.id);
    io.emit('client ID', clients[1].socketId);
  };

  socket.on('disconnect', function() {
    for (i=0; i<clients.length; i++) {
      if (clients[i].socketId === socket.id) {
        clients[i].socketId = 0;
        console.log('client disconnect: ' + socket.id);
      };
    };
  });

  socket.on('client keydown', function(msg) {
    var rxParams = msg.split(' ');
    var rxID = rxParams[0];
    var rxKeydown = rxParams[1];
    for (i=0;i<clients.length;i++) {
      if (rxID === clients[i].socketId) {
        clients[i].keyState[rxKeydown] = true;
      };
    };
  });
  socket.on('client keyup', function(msg) {
    var rxParams = msg.split(' ');
    var rxID = rxParams[0];
    var rxKeyup = rxParams[1];
    for (i=0;i<clients.length;i++) {
      if (rxID === clients[i].socketId) {
        clients[i].keyState[rxKeyup] = false;
      };
    };
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});

function txFrame() {
  var txMsg = '';
  var sp = ' ';
  for (i=0; i<clients.length; i++) {
    txMsg = txMsg.concat(clients[i].x.toString() + sp + clients[i].y.toString() + sp + clients[i].direction.toString() + sp + clients[i].currentImage + sp);
  };
  txMsg = txMsg.trim();
  for (i=0; i<clients.length; i++) {
    io.to(clients[i].socketId).emit('server frame', txMsg);
  };
};

function updateClients() {
  for (i=0; i<clients.length; i++) {
    if (clients[i].exploding) {
      var result = explode(clients[i]);
      if (result === 'end of explosion') {
        clients[i].currentImage = clients[i].defaultImage;
        clients[i].setPosition(clients[i].defaultX, clients[i].defaultY);
        clients[i].setDirection(clients[i].defaultDirection);
      } else {
        clients[i].currentImage = result;
      };
    };
    if (clients[i].keyState[65]) {
      clients[i].rotate(-Math.PI / 32);
      console.log('client: ' + clients[i].socketId + ' rotate counterclockwise');
    };
    if (clients[i].keyState[68]) {
      clients[i].rotate(Math.PI / 32);
      console.log('client: ' + clients[i].socketId + ' rotate clockwise');
    };
    if (clients[i].keyState[87]) {
      clients[i].addVector(clients[i].direction, .001);
      console.log('client: ' + clients[i].socketId + ' thrust');
    };
    if (clients[i].keyState[74]) {
      console.log('client: ' + clients[i].socketId + ' fire');
    };
    clients[i].newPosition();
  };
};

function update() {
  if (clients[0] && clients[1]) {  // don't run until clients are connected
    updateClients();
    if (collision(clients[0], clients[1])) {
      clients[0].exploding = true;
      clients[1].exploding = true;
    };
    txFrame();
  };
};

function collision(obj1, obj2) {
  var centerVector = [obj2.x - obj1.x, obj2.y - obj1.y];
  var distanceSquared = (centerVector[0] * centerVector[0]) + (centerVector[1] * centerVector[1]);
  if (distanceSquared < ((obj1.radius + obj2.radius) * (obj1.radius * obj2.radius))) {
    return true;
  } else {
    return false;
  };
};

function explode(obj) {
  obj.resetVector();
  var increment = 1000 / framerate;
  obj.explosionTimer += increment;
  if (obj.explosionTimer >= obj.explosion[0]) {
    obj.exploding = false;
    obj.explosionTimer = 0;
    obj.explosionFrameCounter = 1;
    return 'end of explosion';
  };
  if (obj.explosionTimer >= obj.explosion[obj.explosionFrameCounter + 1]) {
    obj.explosionFrameCounter += 2;
  };
  return obj.explosion[obj.explosionFrameCounter];
};

setInterval( function() { update(); }, 1000 / framerate);