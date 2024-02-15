const db = require("../../model/mongodb")
const common = require("../../model/common")
const ejs = require('ejs')
const path = require("path")
const { ObjectId } = require("bson")
const { transporter } = require('../../model/mail')
const CONFIG = require("../../config/config.json")
let mailResendAttempts = 2
let templatePathUser = path.resolve('./templates')


const companyVerificationMail = async (mailData) => {
    let errorData, mailOptions
    try {
        errorData = { location: "Company verification mail", funName: "companyVerificationMail" }
        ejs.renderFile(`${templatePathUser}/companyRegistration.ejs`,
            {
                fullName: mailData.fullName,
                contextOne: mailData.contextOne,
                contextTwo: mailData.contextTwo
            }
            , async (err, data) => {
                if (err) {
                    console.log(err);
                    await common.errorMail(errorData)
                } else {
                    mailOptions = {
                        from: process.env.SMTP_AUTH_USER,
                        to: mailData.emailTo,
                        subject: `AllMaster's SocialMedia | Update on your company page`,
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
                            console.log(`Company page verification Mail Not Sent - ${error}`)
                            return console.log(error)
                        }
                        console.log(`Company page verification Mail sent:  - ${info.messageId}`)
                    })
                }
            })
    } catch (error) {
        console.log(`Error sending Company page verification : ${error.message}`)
    }
}


const getReportPost = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }, aggregationQuery = [];
    try {
        let postInfo;
        aggregationQuery = [
            { $match: { reportCount: { $ne: [] }, status: 1 } },
            {
                $lookup:
                {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "userInfo",
                }
            },
            {
                $replaceRoot: { newRoot: { $mergeObjects: [{ fullName: "$userInfo.fullName" }, "$$ROOT"] } }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: "reportCount.userId",
                    foreignField: "_id",
                    as: 'reportUser'
                }
            },
            { $unset: ["reportUser.email", "reportUser.profile", "reportUser.designation", "reportUser.otp", "reportUser.state", "reportUser.country", "reportUser.role", "reportUser.status", "reportUser.password", "reportUser.dob", "reportUser.createdAt", "reportUser.updatedAt"] },
            {
                $addFields: {
                    "reports": {
                        $map: {
                            input: "$reportCount",
                            as: "report",
                            in: {
                                $mergeObjects: [
                                    "$$report",
                                    {
                                        userInfo: {
                                            $arrayElemAt: ["$reportUser", {
                                                $indexOfArray: ["$reportUser._id", "$$report.userId"]
                                            }]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            { $unset: ["reports.userInfo._id"] },
            {
                $project: {
                    'fullName': { '$arrayElemAt': ['$fullName', 0] },
                    "description": "$description",
                    "createdAt": "$createdAt",
                    "reports": "$reports"
                }
            }
        ]
        postInfo = await db.getAggregation("post", aggregationQuery)

        return ctx.response.body = { status: 1, data: JSON.stringify(postInfo) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in admin controllers/getReportPost - ${error.message}` }
    }
}

const deleteReportedPost = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let postData = ctx.request.body, postInfo, updateInfo;
        if (Object.keys(postData).length === 0 && postData.data === undefined) {
            ctx.response.body = data

            return
        }
        postData = postData.data[0];
        postInfo = await db.findSingleDocument("post", { _id: postData.postId, status: 1 })
        if (postInfo == null || postInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No post found" }
        }
        updateInfo = await db.updateOneDocument("post", { _id: postInfo._id }, { status: 0 })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Post as deleted" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in admin controllers/deleteReportedPost - ${error.message}` }
    }
}

const verifiyCompanyPages = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let pageData = ctx.request.body, pageExists, updateInfo;
        if (Object.keys(pageData).length === 0 && pageData.data === undefined) {
            ctx.response.body = data

            return
        }
        pageData = pageData.data[0];
        pageExists = await db.findSingleDocument("companyPage", { _id: new ObjectId(pageData.id) })
        if (pageExists == null) {

            return ctx.response.body = { status: 0, response: "Invalid Request" }
        }
        if (pageData.status == 5) {
            await db.updateManyDocuments("post", { companyId: new ObjectId(pageData.id), status: 1 }, { status: 2 })
            await db.updateManyDocuments("schedule", { companyId: new ObjectId(pageData.id), status: 1 }, { status: 2 })
            await companyVerificationMail(
                {
                    emailTo: pageExists.email,
                    fullName: pageExists.companyName,
                    contextOne: "Due to content or policy violations, our administrator has disabled your page.",
                    contextTwo: "Please contact our team for futhur assistant."
                }
            )
        }
        if (pageData.status == 1) {
            await db.updateManyDocuments("post", { companyId: new ObjectId(pageData.id), status: 2 }, { status: 1 })
            await db.updateManyDocuments("schedule", { companyId: new ObjectId(pageData.id), status: 2 }, { status: 1 })
            if (pageExists.status == 3){
                await companyVerificationMail(
                    {
                        emailTo: pageExists.email,
                        fullName: pageExists.companyName,
                        contextOne: "Your page has been successfully verified by our admin. Congratulations🎉",
                        contextTwo: "The logistics community is eager to hear about your concepts and proposals."
                    }
                )
            }
            if (pageExists.status == 5){
                await companyVerificationMail(
                    {
                        emailTo: pageExists.email,
                        fullName: pageExists.companyName,
                        contextOne: "In accordance with your request, our admin has removed the block restriction for your company page after a double-check. Congratulations🎉",
                        contextTwo: "The logistics community is eager to hear about your concepts and proposals."
                    }
                )
            }
            if (pageExists.status == 4){
                await companyVerificationMail(
                    {
                        emailTo: pageExists.email,
                        fullName: pageExists.companyName,
                        contextOne: "In response to your request, our admin revoked the decision to reject your company page after conducting a further investigation. Congratulations🎉",
                        contextTwo: "The logistics community is eager to hear about your concepts and proposals."
                    }
                )
            }
        }
        if (pageData.status == 4){
            await companyVerificationMail(
                {
                    emailTo: pageExists.email,
                    fullName: pageExists.companyName,
                    contextOne: "Our administrator rejected your company page because the information you submitted is invalid for the organisation you represent, or the policies aren't reliable.",
                    contextTwo: "Please contact our team for futhur assistant."
                }
            )
        }
        updateInfo = await db.findByIdAndUpdate("companyPage", pageData.id, { status: pageData.status })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Company status updated" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in admin controllers/verifiyCompanyPages - ${error.message}` }
    }
}

const getAllUnverifiedPages = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }, pageDetails
    try {
        pageDetails = await db.findDocuments("companyPage", { status: { $in: [1, 3, 4, 5] } }, { updatedAt: 0, otp: 0 })
        if (pageDetails) {

            return ctx.response.body = { status: 1, data: JSON.stringify(pageDetails) }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in admin controllers/getAllUnverifiedPages - ${error.message}` }
    }
}

module.exports = { getReportPost, deleteReportedPost, verifiyCompanyPages, getAllUnverifiedPages }