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
    app.listen(CONFIG.PORT, () => {
      console.log("Server turned on with Koa", CONFIG.ENV, "mode on port", CONFIG.PORT);
    });
  } catch (error) {
    console.log(`Koa server error - ${error}`);
  }
});
