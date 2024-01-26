const db = require("../../model/mongodb")
const common = require("../../model/common")
const ejs = require('ejs')
const path = require("path")
const { ObjectId } = require("bson")
const { transporter } = require('../../model/mail')
let mailResendAttempts = 2
let templatePathUser = path.resolve('./templates')

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
//Resend OTP Mail
const resendOtpMail = async (mailData) => {
    let errorData, mailOptions
    try {
        errorData = { location: "Resend otp", funName: "resendOtpMail" }
        ejs.renderFile(`${templatePathUser}/resendOtp.ejs`,
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
                        subject: `AllMasterSocial | Attention! - New OTP Request |`,
                        html: data
                    }
                    //Send Mail
                    transporter.sendMail(mailOptions, async (error, info) => {
                        if (error) {
                            if (mailResendAttempts !== 0) {
                                resendOtpMail(mailData)
                                mailResendAttempts--
                            } else {
                                mailResendAttempts = 2
                                await common.errorMail(errorData)
                            }
                            console.log(`Resend otp Mail Not Sent - ${error}`)
                            return console.log(error)
                        }
                        console.log(`Resend otp Mail sent:  - ${info.messageId}`)
                    })
                }
            })
    } catch (error) {
        console.log(`Error sending user/resendOtpMail : ${error.message}`)
    }
}

const addCompanyPages = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, pageData, checkUserEmailExist, checkPageEmailExist, pageInsert;
    try {
        pageData = ctx.request.body;
        if (Object.keys(pageData).length === 0 && pageData.data === undefined) {
            ctx.response.body = data

            return
        }
        pageData = pageData.data[0]
        checkUserEmailExist = await db.findOneDocumentExists("user", { email: pageData.email })
        if (checkUserEmailExist == true) {

            return ctx.response.body = { status: 0, response: "Email Already Exists" }
        }
        checkPageEmailExist = await db.findOneDocumentExists("companyPage", { $or: [{ email: pageData.email }, { createdBy: new ObjectId(pageData.createdBy) }] })
        if (checkPageEmailExist == true) {

            return ctx.response.body = { status: 0, response: "Email Already Exists or user Having Already an page" }
        }
        pageData.otp = common.otpGenerate()

        pageInsert = await db.insertSingleDocument("companyPage", pageData)
        if (Object.keys(pageInsert).length !== 0) {
            await registrationOtpMail(
                {
                    emailTo: pageInsert.email,
                    fullName: pageInsert.companyName,
                    otp: pageInsert.otp
                }
            )

            return ctx.response.body = { status: 1, response: "Page Added successfully", data: JSON.stringify(pageInsert._id) }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in page Controller - addCompanyPages:-${error.message}` }
    }
}

const resendOtp = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, pageData, updateOtp, checkEmail;
    try {
        pageData = ctx.request.body;
        if (Object.keys(pageData).length === 0 && pageData.data === undefined) {
            ctx.response.body = data

            return
        }
        pageData = pageData.data[0]
        checkEmail = await db.findSingleDocument("companyPage", { email: pageData.email }, { companyName: 1 })
        if (checkEmail == null || Object.keys(checkEmail).length == 0) {

            return ctx.response.body = { status: 0, response: "Invalid Request" }
        }

        pageData.otp = common.otpGenerate()

        updateOtp = await db.findOneAndUpdate("companyPage", { email: pageData.email }, { otp: pageData.otp })
        if (Object.keys(updateOtp).length !== 0) {
            await resendOtpMail(
                {
                    emailTo: pageData.email,
                    fullName: checkEmail.companyName,
                    otp: pageData.otp
                }
            )

            return ctx.response.body = { status: 1, response: "OTP sended sucessfully" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in page Controller - resendOtp:-${error.message}` }
    }
}

const pageDataById = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, idData, checkId;
    try {
        idData = ctx.request.body;
        if (Object.keys(idData).length === 0 && idData.data === undefined) {
            ctx.response.body = data

            return
        }
        idData = idData.data[0]

        checkId = await db.findSingleDocument("companyPage", { _id: new ObjectId(idData.id) }, { password: 0, otp: 0, createdAt: 0, updatedAt: 0 })
        if (checkId == null || Object.keys(checkId).length == 0) {

            return ctx.response.body = { status: 0, response: "Invalid id" }
        }

        return ctx.response.body = { status: 1, data: JSON.stringify(checkId) }
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in page Controller - pageDataById:-${error.message}` }
    }
}

const verifyOtp = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, otpData, checkOtp, changeUserstatus;
    try {
        otpData = ctx.request.body;
        if (Object.keys(otpData).length === 0 && otpData.data === undefined) {
            ctx.response.body = data

            return
        }
        otpData = otpData.data[0]
        checkOtp = await db.findSingleDocument("companyPage", { _id: new ObjectId(otpData.id), otp: otpData.otp, status: 2 })
        if (checkOtp !== null) {
            changeUserstatus = await db.findByIdAndUpdate("companyPage", otpData.id, { status: 3 })
            if (changeUserstatus.modifiedCount !== 0 && changeUserstatus.matchedCount !== 0) {

                return ctx.response.body = { status: 1, response: "OTP Verified successfully" }

            }

            return ctx.response.body = data
        }
        return ctx.response.body = { status: 1, response: "Invalid Request" }

    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in page Controller - verifyOtp:-${error.message}` }
    }
}

const pageFollow = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, followData, checkCompanyId, checkFollowerId, insertFollowData;
    try {
        followData = ctx.request.body;
        if (Object.keys(followData).length === 0 && followData.data === undefined) {
            ctx.response.body = data

            return
        }
        followData = followData.data[0]

        checkCompanyId = await db.findOneDocumentExists("companyPage", { _id: new ObjectId(followData.companyId), status: 1 })
        if (checkCompanyId == false) {

            return ctx.response.body = { status: 0, response: "Invalid company id" }
        }
        checkFollowerId = await db.findOneDocumentExists("user", { _id: new ObjectId(followData.followerId), status: 1 })
        if (checkCompanyId == false) {

            return ctx.response.body = { status: 0, response: "Invalid FollowerId" }
        }
        insertFollowData = await db.insertSingleDocument("follower", followData)
        if (insertFollowData) {

            return ctx.response.body = { status: 1, response: "followed Sucessfully" }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in page Controller - pageFollow:-${error.message}` }
    }
}

const followListByCompanyId = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, idData, checkCompanyId, followData, aggregationQuery;
    try {
        idData = ctx.request.body;
        if (Object.keys(idData).length === 0 && idData.data === undefined) {
            ctx.response.body = data

            return
        }
        idData = idData.data[0]

        checkCompanyId = await db.findOneDocumentExists("companyPage", { _id: new ObjectId(idData.companyId), status: 1 })
        if (checkCompanyId == false) {

            return ctx.response.body = { status: 0, response: "Invalid company id" }
        }
        aggregationQuery = [
            { $match: { companyId: new ObjectId(idData.companyId), status: 1 } },
            {
                $lookup: {
                    from: "users",
                    localField: "followerId",
                    foreignField: "_id",
                    as: "followData"
                }

            },
            {
                $project: {
                    _id: 1,
                    followerId: 1,
                    followerName: { '$arrayElemAt': ['$followData.fullName', 0] },
                    profile: { '$arrayElemAt': ['$followData.profile', 0] },
                    status: 1,
                    createdAt: 1
                }
            }
        ]

        followData = await db.getAggregation('follower', aggregationQuery)
        if (followData) {

            return ctx.response.body = { status: 1, data: JSON.stringify(followData) }
        }

    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in page Controller - followListByCompanyId:-${error.message}` }
    }
}

const getCompanyProfileById = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, idData, checkId, getFowllersCount, getPostCount, allData;
    try {
        idData = ctx.request.body;
        if (Object.keys(idData).length === 0 && idData.data === undefined) {
            ctx.response.body = data

            return
        }
        idData = idData.data[0]

        checkId = await db.findSingleDocument("companyPage", { _id: new ObjectId(idData.id), status: 1 }, { password: 0, otp: 0, createdAt: 0, updatedAt: 0 })
        if (checkId == null || Object.keys(checkId).length == 0) {

            return ctx.response.body = { status: 0, response: "Invalid id" }
        }
        getFowllersCount = await db.getCountAsync('follower', { companyId: new ObjectId(idData.id), status: 1 })
        getPostCount = await db.getCountAsync('post', { companyId: new ObjectId(idData.id), status: 1 })

        allData = {
            companyPageData: checkId,
            countData: {
                followCount: getFowllersCount,
                postCount: getPostCount
            }
        }

        return ctx.response.body = { status: 1, data: JSON.stringify(allData) }
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in page Controller - pageDataById:-${error.message}` }
    }
}

const unfollowPages = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, followData, updateFollowStatus;
    try {
        followData = ctx.request.body;
        if (Object.keys(followData).length === 0 && followData.data === undefined) {
            ctx.response.body = data

            return
        }
        followData = followData.data[0]

        updateFollowStatus = await db.findByIdAndUpdate("follower", followData.id, { status: 2 })
        if (updateFollowStatus.modifiedCount !== 0 && updateFollowStatus.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "unfollow Sucessfully" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in page Controller - unfollowPages:-${error.message}` }
    }
}

module.exports = {
    addCompanyPages, resendOtp, pageDataById, verifyOtp, pageFollow,
    followListByCompanyId, getCompanyProfileById, unfollowPages
}