const Router = require('koa-router')
const { userRegister} = require("../../controllers/user/user")
const userRouter = new Router({ prefix: "/users" })

try {
    userRouter.get("/", userRegister)
} catch (error) {
    console.log(`error in user router - ${error}`);
}
 
 
module.exports = { userRouter }