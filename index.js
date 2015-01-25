var express = require('express'),
//
app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket) {
  socket.on('client keydown', function(msg) {
    console.log('client keydown: ' + msg);
  });
  socket.on('client keyup', function(msg) {
    console.log('client keyup: ' + msg);
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});

