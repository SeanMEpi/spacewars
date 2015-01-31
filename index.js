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
  this.socketId = null;
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
  this.addVector = function(direction, impulse) {
    xToAdd = impulse * Math.cos(direction);
    yToAdd = impulse * Math.sin(direction);
    this.vector[0] += xToAdd;
    this.vector[1] += yToAdd;
  };
};

io.on('connection', function(socket) {
  ship = new Ship();
  ship.socketId = socket.id;
  console.log('client connect: ' + socket.id);
  io.emit('client ID', ship.socketId);
  ships.push(ship);

  socket.on('disconnect', function() {
    for (i=0; i<ships.length; i++) {
      if (ships[i].socketId === socket.id) {
        ships.splice(i,1);
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

function update(s1_x, s1_y, s1_angle, s2_x, s2_y, s2_angle) {
  var txMsg = s1_x.toString() + ' ' + s1_y.toString() + ' ' + s1_angle.toString() + ' ' +
              s2_x.toString() + ' ' + s2_y.toString() + ' ' + s2_angle.toString();
  io.emit('server frame', txMsg);
};

setInterval( function() { update(.100, .100, 0, .400, .400, 3 * Math.PI / 2); }, 1000/60);



