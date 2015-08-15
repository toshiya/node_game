var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = 6302;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static('public'));

io.on('connection', function (socket) {
    console.log('1 device joined.');
    socket.on("sendMessageToServer", function (data) {
        if (data.X) {
            io.emit("sendMessageToClient", {X:data.X, Y:data.Y, Z:data.Y});
        }
        
        if (data.touch) {
            io.emit("sendMessageToClient", {touch:data.touch});
        }
    });     
    socket.on("disconnect", function () {
        console.log('1 device left.');
    });
});
