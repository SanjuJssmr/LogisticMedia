const db = require("../../model/mongodb")
const common = require("../../model/common")

const registrationOtpMail = async (mailData) => {
    let errorData, mailOptions
    try {
        errorData = { location: "Registration Successfull OTP", funName: "registrationOtpMail" }
        ejs.renderFile(`${templatePathUser}/userRegister.ejs`,
            {
                fullName: mailData.fullName,
                email: mailData.emailTo,
                otp: mailData.otp
            }
            , async (err, data) => {
                if (err) {
                    console.log(err);
                    await common.errorMail(errorData)
                } else {
                    mailOptions = {
                        from: process.env.SMTP_AUTH_USER,
                        to: mailData.emailTo,
                        subject: `AllMasterSocial | Registration Verification |OTP Confirmation`,
                        html: data
                    }
                    //Send Mail
                    transporter.sendMail(mailOptions, async (error, info) => {
                        if (error) {
                            if (mailResendAttempts !== 0) {
                                registrationOtpMail(mailData)
                                mailResendAttempts--
                            } else {
                                mailResendAttempts = 2
                                await common.errorMail(errorData)
                            }
                            console.log(`Registration OTP verification Mail Not Sent - ${error}`)
                            return console.log(error)
                        }
                        console.log(`Registration OTP verification Mail sent:  - ${info.messageId}`)
                    })
                }
            })
    } catch (error) {
        console.log(`Error sending Registration OTP verification : ${error.message}`)
    }
}

const addCompanyPages = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, pageData, checkUserEmailExist,checkPageEmailExist, userInsert;
    try {
        pageData = ctx.request.body;
        if (Object.keys(pageData).length === 0 && pageData.data === undefined) {
            res.send(data)

            return
        }
        pageData = pageData.data[0]
        checkUserEmailExist = await db.findOneDocumentExists("user", { email: pageData.email })
        if (checkUserEmailExist == true) {

            return ctx.response.body = { status: 0, response: "Email Already Exists" }
        }
        checkPageEmailExist = await db.findOneDocumentExists("page", { email: pageData.email })
        if (checkPageEmailExist == true) {

            return ctx.response.body = { status: 0, response: "Email Already Exists" }
        }
        userData.otp = common.otpGenerate()

        userInsert = await db.insertSingleDocument("page", userData)
        if (Object.keys(userInsert).length !== 0) {
            await registrationOtpMail(
                {
                    emailTo: userInsert.email,
                    fullName: userInsert.fullName,
                    otp: userInsert.otp
                }
            )

            return ctx.response.body = { status: 1, response: "Page Added successfully", data: JSON.stringify(userInsert._id) }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in page Controller - addCompanyPages:-${error.message}` }
    }
}

module.exports= {addCompanyPages}