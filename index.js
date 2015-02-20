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

objects[0] = new Thing(); // player ship
objects[1] = new Thing(); // player ship

io.on('connection', function(socket) {
  var set = false;
  if (objects[0].socketId === 0) {
    objects[0].socketId = socket.id;
    objects[0].defaultX = .100;
    objects[0].defaultY = .500;
    objects[0].setPosition(objects[0].defaultX, objects[0].defaultY);
    objects[0].defaultDirection = 0;
    objects[0].setDirection(objects[0].defaultDirection);
    objects[0].resetVector();
    console.log('client connect: ' + socket.id);
    io.emit('client ID', objects[0].socketId);
    set = true;
  };
  if ((objects[1].socketId === 0) && (!set)) {
    objects[1].socketId = socket.id;
    objects[1].defaultX = .900;
    objects[1].defaultY = .500;
    objects[1].setPosition(objects[1].defaultX, objects[1].defaultY);
    objects[1].defaultDirection = Math.PI;
    objects[1].setDirection(objects[1].defaultDirection);
    objects[1].resetVector()
    console.log('client connect: ' + socket.id);
    io.emit('client ID', objects[1].socketId);
  };

  socket.on('disconnect', function() {
    for (i=0; i<objects.length; i++) {
      if (objects[i].socketId === socket.id) {
        objects[i].socketId = 0;
        console.log('client disconnect: ' + socket.id);
      };
    };
  });

  socket.on('client keydown', function(msg) {
    var rxParams = msg.split(' ');
    var rxID = rxParams[0];
    var rxKeydown = rxParams[1];
    for (i=0;i<objects.length;i++) {
      if (rxID === objects[i].socketId) {
        objects[i].keyState[rxKeydown] = true;
      };
    };
  });
  socket.on('client keyup', function(msg) {
    var rxParams = msg.split(' ');
    var rxID = rxParams[0];
    var rxKeyup = rxParams[1];
    for (i=0;i<objects.length;i++) {
      if (rxID === objects[i].socketId) {
        objects[i].keyState[rxKeyup] = false;
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
  for (i=0; i<objects.length; i++) {
    io.to(objects[i].socketId).emit('server frame', txMsg);
  };
};

function updateClients() {
  for (i=0; i<objects.length; i++) {
    if (objects[i].exploding) {
      var result = explode(objects[i]);
      if (result === 'end of explosion') {
        objects[i].currentImage = objects[i].defaultImage;
        objects[i].setPosition(objects[i].defaultX, objects[i].defaultY);
        objects[i].setDirection(objects[i].defaultDirection);
      } else {
        objects[i].currentImage = result;
      };
    };
    if (objects[i].keyState[65]) {
      objects[i].rotate(-Math.PI / 32);
      console.log('client: ' + objects[i].socketId + ' rotate counterclockwise');
    };
    if (objects[i].keyState[68]) {
      objects[i].rotate(Math.PI / 32);
      console.log('client: ' + objects[i].socketId + ' rotate clockwise');
    };
    if (objects[i].keyState[87]) {
      objects[i].addVector(objects[i].direction, .001);
      console.log('client: ' + objects[i].socketId + ' thrust');
    };
    if (objects[i].keyState[74]) {
      console.log('client: ' + objects[i].socketId + ' fire');
    };
    objects[i].newPosition();
  };
};

function update() {
  if (objects[0] && objects[1]) {  // don't run until clients are connected
    updateClients();
    if (collision(objects[0], objects[1])) {
      objects[0].exploding = true;
      objects[1].exploding = true;
    };
    txFrame(objects[0].x, objects[0].y, objects[0].direction, objects[0].currentImage, objects[1].x, objects[1].y, objects[1].direction, objects[1].currentImage);
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