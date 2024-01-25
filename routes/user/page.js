const Router = require('koa-router')
const { addCompanyPages, pageDataById, resendOtp } = require("../../controllers/user/page")
const { verifiyCompanyPages, getAllUnverifiedPages } = require("../../controllers/user/admin")

// const { userRegisterValidation } = require("../../validation/userValidation")
const pageRouter = new Router({ prefix: "/pages" })

try {
    pageRouter.post("/addCompanyPages", addCompanyPages)
    pageRouter.post("/resendOtp", resendOtp)
    pageRouter.post("/pageDataById", pageDataById)
    pageRouter.post("/verifiyCompanyPages", verifiyCompanyPages)
    pageRouter.post("/getAllUnverifiedPages", getAllUnverifiedPages)

} catch (error) {
    console.log(`error in user router - ${error}`);
}

module.exports = { pageRouter }