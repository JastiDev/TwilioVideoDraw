const socketio = require("socket.io");

let io;

let dicStar = {};

const initSocketServer = (server) => {
  io = socketio(server);

  const nspDraw = io.of("/twilio-draw");

  nspDraw.on("connection", (socket) => {

    socket.on("i-joined-room", ({ username, room}) => {
      console.log( 'joined', username, room );
      socket.join(room);
      dicStar[socket.id] = { username, room };
      socket.to(room).emit("one-joined-room", { username});
    });

    socket.on('i-left-room', ({ username, room }) => {
      console.log('left', username, room);
      socket.leaveAll();
      delete dicStar[socket.id];
      socket.to(room).emit("one-left-room", { username });
    });

    socket.on("disconnect", () => {
      let username = "?";
      let star = dicStar[socket.id];
      if (star) username = star.username;

      nspDraw.emit("star-disconnected", { username });
    });

    socket.on('i-captured', ({ username, room, captureURL, videoWidth, videoHeight }) => {
      console.log('captured', username, room);
      socket.to(room).emit('one-captured', { username, room, captureURL, videoWidth, videoHeight });
    });

    socket.on('i-draw', ({ username, room, drawterm }) => {
      // console.log(username, room, drawterm);
      socket.to(room).emit('one-draw', { username, drawterm });
    });
  });
};

module.exports = { initSocketServer };
