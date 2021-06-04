const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");

/**
 * - socket.io object
 *   this create the server
 * - second parentheses for options
 * */
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Running");
});

/**
 * - io.on create the connection
 *
 * - tjhe second parameter is the socket created
 *
 * - socket.on
 *   listen events or messages sended to the server with emit
 *
 * - socket.emit
 *   send information like messages
 */
/************* chat *************/
 console.log(`Server outside...`);

io.on("connection", (socket) => {
  /************* chat *************/
  console.log(`Server inside connection`);

  // send the id to the sever
  socket.emit("me", socket.id);

  socket.on("disconnect", () => {
    socket.broadcast.emit("callEnded");
  });

  socket.on("callUser", ({ userToCall, signalData, from, name }) => {
    console.log(`userToCall ${userToCall} - signalData ${signalData} - from ${from} - name ${name}`);
    io.to(userToCall).emit("callUser", { signal: signalData, from, name });
  });

  socket.on("answerCall", (data) => {
    console.log(`// #2.6# BACK data.signal ${data.signal}`);
    io.to(data.to).emit("callAccepted", data.signal);
  });

	/************* chat *************/
  socket.on("chat message", (msg) => {
    socket.broadcast.emit("chat message", msg);
    console.log(`Message recibed: ${msg}`);
    //io.emit("hello", "world");
  });

	/************* end chat *************/
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
