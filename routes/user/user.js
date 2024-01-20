const Router = require('koa-router')
const { userRegister, updateRegisterData, resendOtp, login, verifyOtp } = require("../../controllers/user/user")
// const { userRegisterValidation } = require("../../validation/userValidation")
const userRouter = new Router({ prefix: "/users" })

try {
    userRouter.post("/userRegister", userRegister)
    userRouter.post("/updateRegisterData", updateRegisterData)
    userRouter.post("/resendOtp", resendOtp)
    userRouter.post("/login", login)
    userRouter.post("/verifyOtp", verifyOtp)

} catch (error) {
    console.log(`error in user router - ${error}`);
}

module.exports = { userRouter }