const db = require("../../model/mongodb")
const common = require("../../model/common")

const userRegister = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, userData, checkEmailExist, userInsert;
    try {
        userData = ctx.request.body;
        if (Object.keys(userData).length === 0 && userData.data === undefined) {
            res.send(data)

            return
        }
        userData = userData.data[0]
        checkEmailExist = await db.findOneDocumentExists("user", { email: userData.email })
        if (checkExist == true) {

            return ctx.response.body = { status: 0, response: "Email Already Exists" }
        }
        userData.password = await bcrypt.hash(userData.password, 10)
        userData.otp = common.otpGenerate()

        userInsert = await db.insertSingleDocument("user", userData)
        if (Object.keys(userInsert).length !== 0) {

            return ctx.response.body = { status: 1, response: "Registration successfull" }
        }

        return ctx.response.body = data
    } catch (error) {
        return ctx.response.body = { status: 0, response: `Error in user Controller - userRegister:-${error.message}` }
    }
}

module.exports = { userRegister }