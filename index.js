/* ----- setup ----- */
var express = require('express'),
app = express();
/* ----- http server for client files ----- */
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname + '/public'));

/* ----- engine setup ----- */
var framerate = 60; // frames per second
var objects = [];
var clients = [];

/* ----- Engine object defintions and related functions -----*/
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
  this.explosion = ['shipExp0', 20, 'shipExp1', 40, 'shipExp2', 60, 'shipExp3', 80,
                    'shipExp4', 100, 'shipExp5', 120, 'shipExp6', 140, 'shipExp7', 160,
                    'shipExp8', 180, 'shipExp9', 200, 'shipExp10', 220, 'shipExp11', 240,
                    'shipExp12', 260, 'shipExp13', 280, 'shipExp14', 300, 'shipExp15', 320,
                    'shipExp16', 340, 'shipExp17', 360, 'shipExp18', 380, 'shipExp19', 400,
                    'shipExp20', 420, 'shipExp21', 440, 'shipExp22', 460, 'shipExp23', 480];
  this.explosionTimer = 0;
  this.explosionFrameCounter = 0;
  this.exploding = false;
  this.lifetime = 0;
  this.lifeTimer = 0;
  this.visible = true;
  this.torpedos = [];
  this.firingDelay = 50;
  this.firingDelayCounter = 0;
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
  if (obj.explosionTimer >= obj.explosion[obj.explosion.length - 1]) {
    obj.exploding = false;
    obj.explosionTimer = 0;
    obj.explosionFrameCounter = 0;
    return 'end of explosion';
  };
  if (obj.explosionTimer >= obj.explosion[obj.explosionFrameCounter + 1]) {
    obj.explosionFrameCounter += 2;
  };
  return obj.explosion[obj.explosionFrameCounter];
};

function lifeCountdown(obj) {
  var increment = 1000 / framerate;
  obj.lifeCounter += increment;
  if (obj.lifeCounter >= obj.lifetime) {
    obj.visible = false; // mask from client frame
    obj.lifecounter = 0; // reset lifecounter
    return 'dead';
  };
  return 'alive';
};

function firingDelay(obj) {
  var increment = 1000 / framerate;
  obj.firingDelayCounter += increment;
  if (obj.firingDelayCounter >= obj.firingDelay) {
    obj.firingDelayCounter = 0; // reset counter
    return 'ready to fire';
  };
  return 'not ready to fire';
};

/* ----- add client ships ----- */
clients[0] = new Thing();
/* ----- add torpedos to player ship ----- */
for (i=0; i<5; i++) {
  clients[0].torpedos[i] = new Thing();
  clients[0].torpedos[i].visible = false;
  clients[0].torpedos[i].lifetime = 500;
};
clients[1] = new Thing();
for (i=0; i<5; i++) {
  clients[1].torpedos[i] = new Thing();
  clients[1].torpedos[i].visible = false;
  clients[1].torpedos[i].lifetime = 500;
};

/* ----- client connect & disconnect (single game instance) ----- */
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
  /* ----- Client control reception ----- */
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

/* ----- Engine loop ----- */
function txFrame() {
  var txMsg = '';
  for (i=0; i<clients.length; i++) {
    txMsg = txMsg.concat(txFrameItem(clients[i]));
  };
  txMsg = txMsg.trim();
  for (i=0; i<clients.length; i++) {
    io.to(clients[i].socketId).emit('server frame', txMsg);
  };
};

function txFrameItem(objectToAdd) {
  txMsgSlice = '';
  var sp = ' ';
  txMsgSlice = txMsgSlice.concat(objectToAdd.x.toString() + sp + objectToAdd.y.toString() + sp + objectToAdd.direction.toString() + sp + objectToAdd.currentImage + sp);
  return txMsgSlice;
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

setInterval( function() { update(); }, 1000 / framerate);