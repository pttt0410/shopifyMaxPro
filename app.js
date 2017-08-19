var express = require('express');
var morgan = require('morgan');
const app = express();

app.use(morgan('dev'));

var socketIO = require('socket.io');
var http = require('http');
var https = require('https');
var fs = require("fs");
const privateKey = fs.readFileSync('key/key.pem', 'utf8');
const certificate = fs.readFileSync('key/cert.pem', 'utf8');
const server_passphrase = require('./key/passphrase.js');
const credentials = { key: privateKey, cert: certificate, passphrase: server_passphrase };
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/static'));
var mongo_url = require('./config/mongo');
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect(mongo_url, function(err, db) {
    // var serverSSL = https.createServer(credentials, app);
    var server = http.createServer(app);

    var io = socketIO.listen(server);
    server.listen(3000, function() {
        console.log("Server is running on port 3000.");
    });
    // serverSSL.listen(3000, function() {
    //     console.log("Server is running on port 3000.");
    // });
    require('./controller/server')(app, db, io);
    io.on('connection', function(client) {
        db.collection('socket').insert({ sid: client.id, name: client.handshake.query.name })
            .then(
                (result) => console.log("socket: " + client.id + " client connected."),
                (error) => console.log("socket: " + client.id + " Can not add to database.")
            );
        // console.log("socket connected: " + client.handshake.query.name);
        client.on('disconnect', function() {
            db.collection('socket').findOneAndDelete({ sid: client.id })
                .then(
                    (result) => console.log("socket:" + result.name + " client disconnected."),
                    (error) => console.log("socket: " + result.name + " Can not add to database.")
                );
        });
        // client.on('redirect', function() {
        //     db.collection('socket').findOneAndDelete({ sid: client.id })
        //     .then(
        //         (result) => console.log("socket:" + result.name + " client disconnected."),
        //         (error) => console.log("socket: " + result.name + " Can not add to database.")
        //         );
        // });
    });
});

//io.sockets.connected(socket.id).emit("topic", data)
