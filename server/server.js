const express = require("express");
const socket = require("socket.io");
const app = express();

let server = app.listen(3000);
console.log("The server is now running");

app.use(express.static("public"));

let io = socket(server);

//store the positions of each client in this object.
//It would be safer to connect it to a database as well so the data doesn't get destroyed when the server restarts
//but we'll just use an object for simplicity.
const positions = {};
let gameStatus = 0;

//Socket configuration
io.on("connection", (socket) => {
  //each time someone visits the site and connect to socket.io this function  gets called
  //it includes the socket object from which you can get the id, useful for identifying each client
  console.log(`${socket.id} connected`);
  reset();

  //lets add a starting position when the client connects
  //positions[socket.id] = { x: 0.5, y: 0.5 };
  positions[socket.id] = {};

  socket.on("disconnect", () => {
    //when this client disconnects, lets delete its position from the object.
    delete positions[socket.id];
    //console.log(`${socket.id} disconnected`);
    reset();
  });

  //client can send a message 'updatePosition' each time the clients position changes
  socket.on("updatePlayer", (data) => {
    for (const [key, value] of Object.entries(data)) {
      positions[socket.id][key] = value;
    }
    //console.log(positions);
  });

  socket.on("startGame", () => {
    console.log("Start Game");
    reset();
    gameStatus = 1;
    // Reset infections

    // Set infected to randomly
    const keys = Object.keys(positions);
    const prop = keys[Math.floor(Math.random() * keys.length)];

    positions[prop].infected = true;
  });

  socket.on("endGame", () => {
    if (gameStatus == 1) {
      console.log("Game Over");

      gameStatus = 0;
    }
  });
});

function reset() {
  console.log("reset");
  gameStatus = 0;
  for (const key in positions) {
    positions[key].infected = false;
    positions[key].winner = false;
  }
}

//send positions every framerate to each client
const frameRate = 30;
setInterval(() => {
  io.emit("update", { players: positions, game: gameStatus });
}, 1000 / frameRate);
