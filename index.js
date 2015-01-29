var express = require('express'),
app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname + '/public'));

function Ship() {
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
  socket.on('client keydown', function(msg) {
    console.log('client keydown: ' + msg);
    io.emit('server message', msg);
  });
  socket.on('client keyup', function(msg) {
    console.log('client keyup: ' + msg);
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



