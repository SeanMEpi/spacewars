var express = require('express'),
app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname + '/public'));

var framerate = 60; // frames per second

var ships = [];
function Ship() {
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

ships[0] = new Ship();
ships[1] = new Ship();

io.on('connection', function(socket) {
  var set = false;
  if (ships[0].socketId === 0) {
    ships[0].socketId = socket.id;
    ships[0].defaultX = .100;
    ships[0].defaultY = .500;
    ships[0].setPosition(ships[0].defaultX, ships[0].defaultY);
    ships[0].defaultDirection = 0;
    ships[0].setDirection(ships[0].defaultDirection);
    ships[0].resetVector();
    console.log('client connect: ' + socket.id);
    io.emit('client ID', ships[0].socketId);
    set = true;
  };
  if ((ships[1].socketId === 0) && (!set)) {
    ships[1].socketId = socket.id;
    ships[1].defaultX = .900;
    ships[1].defaultY = .500;
    ships[1].setPosition(ships[1].defaultX, ships[1].defaultY);
    ships[1].defaultDirection = Math.PI;
    ships[1].setDirection(ships[1].defaultDirection);
    ships[1].resetVector()
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
    for (i=0;i<ships.length;i++) {
      if (rxID === ships[i].socketId) {
        ships[i].keyState[rxKeydown] = true;
      };
    };
  });
  socket.on('client keyup', function(msg) {
    var rxParams = msg.split(' ');
    var rxID = rxParams[0];
    var rxKeyup = rxParams[1];
    for (i=0;i<ships.length;i++) {
      if (rxID === ships[i].socketId) {
        ships[i].keyState[rxKeyup] = false;
      };
    };
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});

function txFrame(s1_x, s1_y, s1_angle, s1_image, s2_x, s2_y, s2_angle, s2_image) {
  var txMsg = s1_x.toString() + ' ' + s1_y.toString() + ' ' + s1_angle.toString() + ' ' + s1_image + ' ' +
              s2_x.toString() + ' ' + s2_y.toString() + ' ' + s2_angle.toString() + ' ' + s2_image;
  for (i=0; i<ships.length; i++) {
    io.to(ships[i].socketId).emit('server frame', txMsg);
  };
};

function updateClients() {
  for (i=0; i<ships.length; i++) {
    if (ships[i].exploding) {
      var result = explode(ships[i]);
      if (result === 'end of explosion') {
        ships[i].currentImage = ships[i].defaultImage;
        ships[i].setPosition(ships[i].defaultX, ships[i].defaultY);
        ships[i].setDirection(ships[i].defaultDirection);
      } else {
        ships[i].currentImage = result;
      };
    };
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

function update() {
  if (ships[0] && ships[1]) {  // don't run until clients are connected
    updateClients();
    if (collision(ships[0], ships[1])) {
      ships[0].exploding = true;
      ships[1].exploding = true;
    };
    txFrame(ships[0].x, ships[0].y, ships[0].direction, ships[0].currentImage, ships[1].x, ships[1].y, ships[1].direction, ships[1].currentImage);
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