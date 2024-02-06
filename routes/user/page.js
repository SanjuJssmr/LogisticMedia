const Router = require('koa-router')
const { addCompanyPages, pageDataById, resendOtp, pageFollow, followListByCompanyId,
     verifyOtp,getCompanyProfileById, unfollowPages, getCompanyDataByFollowersDescending, 
     topPages} = require("../../controllers/user/page")
const { verifiyCompanyPages, getAllUnverifiedPages } = require("../../controllers/user/admin")

// const { userRegisterValidation } = require("../../validation/userValidation")
const pageRouter = new Router({ prefix: "/pages" })

try {
    pageRouter.post("/addCompanyPages", addCompanyPages)
    pageRouter.post("/resendOtp", resendOtp)
    pageRouter.post("/pageDataById", pageDataById)
    pageRouter.post("/verifiyCompanyPages", verifiyCompanyPages)
    pageRouter.get("/getAllUnverifiedPages", getAllUnverifiedPages)
    pageRouter.post("/verifyOtp", verifyOtp)
    pageRouter.post("/pageFollow", pageFollow)
    pageRouter.post("/followListByCompanyId", followListByCompanyId)
    pageRouter.post("/getCompanyProfileById", getCompanyProfileById)
    pageRouter.post("/unfollowPages", unfollowPages)
    pageRouter.post("/getCompanyDataByFollowersDescending", getCompanyDataByFollowersDescending)

} catch (error) {
    console.log(`error in page router - ${error}`);
}

module.exports = { pageRouter }