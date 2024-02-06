const koa = require("koa")
const mongoose = require("mongoose")
const { userRouter } = require('./routes/user/user');
const bodyParser = require("koa-bodyparser");
const CONFIG = require("./config/config");
const { postRouter } = require("./routes/post/post");
const { pageRouter } = require("./routes/user/page");
const cors = require('@koa/cors');
const multer = require("@koa/multer");
const { scheduleRouter } = require("./routes/post/schedule");
const { qaRouter } = require("./routes/post/qa");
const socketIo = require("socket.io");
const db = require("./model/mongodb");
const { advertisementRouter } = require("./routes/post/advertisment");

const io = socketIo(8900, {
  cors: {
    origin: "*",
  },
});

const app = new koa()
app.use(bodyParser())

app.use(cors({
  origin: '*',   // specify the allowed origins
  credentials: true,               // include credentials in CORS requests
  methods: ['GET', 'POST'],        // specify allowed HTTP methods
  allowedHeaders: ["Origin", "X-Requested-with", "Content-Type", "Accept", "Authorization"], // specify allowed headers
}));

app.use(multer().any())

app.on('error', (err, ctx) => {
  console.log('server error', err, ctx)
});


let users = [];

const addUser = ( userId, socketId) => {
  users = users.filter((user) => user.userId !== userId)
  users.push({ userId, socketId });
}

const getUser = (receiverId, onlineUser) => {
  return onlineUser.filter((user) => user.userId === receiverId);
};

io.on("connection", (socket) => {

  socket.on("users", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  socket.on("sendNotification", ({ senderId, receiverId }) => {
    const receiver = getUser(receiverId, users);
    if (receiver.length !== 0) {
      io.to(receiver[0].socketId).emit("getNotification", {
        senderId,
        receiverId
      });
    }
  });

  socket.on("sendMessage", async ({ connectionId, senderId, senderName, receiverId, message, createdAt }) => {
    const user = getUser(receiverId, users);
    if (user.length !== 0) {
      io.to(user[0].socketId).emit("getMessage", {
        senderId,
        senderName,
        receiverId,
        message,
        createdAt,
      });
      await db.insertSingleDocument("chat", { connectionId: connectionId, sender: senderId, message: message, status: 1 })

      return
    }
    await db.insertSingleDocument("chat", { connectionId: connectionId, sender: senderId, message: message })
  });

  socket.on("disconnect", () => {
    users = users.filter((user) => user.socketId !== socket.id);
    io.emit("getUsers", users);
  });
});

mongoose.connect(CONFIG.DB_URL)
mongoose.connection.on('disconnected', () => console.log('disconnected'));
mongoose.connection.on('reconnected', () => console.log('reconnected'));
mongoose.connection.on('disconnecting', () => console.log('disconnecting'));
mongoose.connection.on('close', () => console.log('close'));
mongoose.connection.on('connected', () => {
  try {
    app.use(userRouter.routes())
    app.use(pageRouter.routes())
    app.use(postRouter.routes())
    app.use(scheduleRouter.routes())
    app.use(qaRouter.routes())
    app.use(advertisementRouter.routes())
    app.listen(CONFIG.PORT, () => {
      console.log("Server turned on with Koa", CONFIG.ENV, "mode on port", CONFIG.PORT);
    });
  } catch (error) {
    console.log(`Koa server error - ${error}`);
  }
});
