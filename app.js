const koa = require("koa")
const mongoose = require("mongoose")
const { userRouter } = require('./routes/user/user');
const bodyParser = require("koa-bodyparser");
const CONFIG = require("./config/config");
const { postRouter } = require("./routes/post/post");;
const cors = require('@koa/cors');

const app = new koa()
app.use(bodyParser())

app.use(cors());

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
    app.use(postRouter.routes())
    app.listen(CONFIG.PORT, () => {
      console.log("Server turned on with Koa", CONFIG.ENV, "mode on port", CONFIG.PORT);
    });
  } catch (error) {
    console.log(`Koa server error - ${error}`);
  }
});
