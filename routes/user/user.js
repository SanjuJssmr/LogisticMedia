const Router = require('koa-router')
const { userRegister, updateRegisterData, resendOtp,
    login, verifyOtp, updateUserDetails, userConnectionRequest,
    getProfileById, getAllUser, getConnectionRequestListById,
    acceptConnectionRequest, getFollowListByUserId, getFollowingListByUserId } = require("../../controllers/user/user")

const { getReportPost, deleteReportedPost } = require("../../controllers/user/admin")
// const { userRegisterValidation } = require("../../validation/userValidation")
const userRouter = new Router({ prefix: "/users" })

try {
    userRouter.post("/userRegister", userRegister)
    userRouter.post("/updateRegisterData", updateRegisterData)
    userRouter.post("/resendOtp", resendOtp)
    userRouter.post("/login", login)
    userRouter.post("/verifyOtp", verifyOtp)
    userRouter.post("/updateUserDetails", updateUserDetails)  // image pending
    userRouter.post("/userConnectionRequest", userConnectionRequest)
    userRouter.post("/getProfileById", getProfileById)
    userRouter.post("/getAllUser", getAllUser)
    userRouter.post("/getConnectionRequestListById", getConnectionRequestListById)
    userRouter.post("/acceptConnectionRequest", acceptConnectionRequest)
    userRouter.post("/getFollowListByUserId", getFollowListByUserId)
    userRouter.post("/getFollowingListByUserId", getFollowingListByUserId)
    userRouter.get("/getReportPost", getReportPost)
    userRouter.post("/deleteReportedPost", deleteReportedPost)

} catch (error) {
    console.log(`error in user router - ${error}`);
}

module.exports = { userRouter }