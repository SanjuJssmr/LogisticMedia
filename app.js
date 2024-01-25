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
const fs = require("fs").promises;
const jwt = require("jsonwebtoken");
const socketIo = require("socket.io");
const db = require("./model/mongodb")

const io = socketIo(process.env.SOCKETPORT, {
  cors: {
    origin: "*",
  },
});

const app = new koa()
app.use(bodyParser())

app.use(cors({
  origin: 'http://localhost:5173',   // specify the allowed origins
  credentials: true,               // include credentials in CORS requests
  methods: ['GET', 'POST'],        // specify allowed HTTP methods
  allowedHeaders: ["Origin", "X-Requested-with", "Content-Type", "Accept", "Authorization"], // specify allowed headers
}));

app.use(multer().any())

app.on('error', (err, ctx) => {
  console.log('server error', err, ctx)
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.query.token;

    let privateKey = await fs.readFile("privateKey.key", "utf8");

    let verifyAccessToken = jwt.verify(token, privateKey, {
      algorithms: ["RS256"],
    });
    let checkAccessAuth = await common.checkUserInDB(verifyAccessToken);
    if (checkAccessAuth == null || checkAccessAuth.length === 0) {
      return res.status(401).send("Unauthorized");
    }
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});


let users = [];

const addUser = (connectionId, userId, socketId) => {
  users = users.filter((user) => user.userId !== userId)
  users.push({ connectionId, userId, socketId });
}

const getUser = (receiverId, onlineUser) => {
  return onlineUser.filter((user) => user.userId === receiverId);
};

io.on("connection", (socket) => {

  socket.on("users", (connectionId, userId) => {
    addUser(connectionId, userId, socket.id);
    io.emit("getUsers", users);
  });

  socket.on("sendMessage", async ({ connectionId, senderId, receiverId, message }) => {
    const user = getUser(receiverId, users);
    if (user.length !== 0) {
      io.to(user[0].socketId).emit("getMessage", {
        senderId,
        senderName,
        message,
        createdAt
      });
      await db.insertSingleDocument("chat", { connectionId: connectionId, sender: senderId, message: message, status: 1 })
    }
    await db.insertSingleDocument("chat", { connectionId: connectionId, sender: senderId, message: message})
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
    app.listen(CONFIG.PORT, () => {
      console.log("Server turned on with Koa", CONFIG.ENV, "mode on port", CONFIG.PORT);
    });
  } catch (error) {
    console.log(`Koa server error - ${error}`);
  }
});
