
const userRegister = async (ctx, next) => {
    try {
        // let userData = ctx.request.body, checkExist, userInfo, hashPass;
        // checkExist = await User.findOne({ email: userData.email })
        // if (checkExist != null) {
 
        //     return ctx.response.body = { status: 0, response: "User already exist" }
        // }
        // hashPass = await bcrypt.hash(userData.password, 8)
        // userData.password = hashPass
        // userInfo = await User.create(userData)
        // if (Object.keys(userInfo).length !== 0) {
 
        //     return ctx.response.body = { status: 1, response: "Registration successfull" }
        // }
 
        return ctx.response.body = { status: 0, response: "Something went wrong" }
    } catch (error) {
        return ctx.response.body = { status: 0, response: error.message }
    }
}
 
module.exports = { userRegister }