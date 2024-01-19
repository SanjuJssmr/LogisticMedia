const Router = require('koa-router')
const { userRegister } = require("../../controllers/user/user")
const { } = require("../../validation/userValidation")
const userRouter = new Router({ prefix: "/users" })

try {
    userRouter.post("/userRegister", userRegister)
} catch (error) {
    console.log(`error in user router - ${error}`);
}


module.exports = { userRouter }