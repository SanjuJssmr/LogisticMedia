const Router = require('koa-router')
const { addCompanyPages } = require("../../controllers/user/page")

// const { userRegisterValidation } = require("../../validation/userValidation")
const pageRouter = new Router({ prefix: "/pages" })

try {
    pageRouter.post("/addCompanyPage", addCompanyPages)

} catch (error) {
    console.log(`error in user router - ${error}`);
}

module.exports = { pageRouter }