const db = require("../../model/mongodb")
const common = require("../../model/common")
const path = require('path')
const bcrypt = require("bcrypt")
const ejs = require('ejs')
const fs = require("fs").promises
const jwt = require("jsonwebtoken")
const { ObjectId } = require("bson")
const { transporter } = require('../../model/mail')
const mailResendAttempts = 2
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
        if (checkEmailExist == true) {

            return ctx.response.body = { status: 0, response: "Email Already Exists" }
        }
        userData.password = await bcrypt.hash(userData.password, 10)
        userData.otp = common.otpGenerate()

        userInsert = await db.insertSingleDocument("user", userData)
        if (Object.keys(userInsert).length !== 0) {
            await registrationOtpMail(
                {
                    emailTo: userInsert.email,
                    fullName: userInsert.fullName,
                    otp: userInsert.otp
                }
            )

            return ctx.response.body = { status: 1, response: "Registration successfully", data: JSON.stringify(userInsert._id) }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - userRegister:-${error.message}` }
    }
}

const updateRegisterData = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, userData, checkEmailExist, updateuserData;
    try {
        userData = ctx.request.body;
        if (Object.keys(userData).length === 0 && userData.data === undefined) {
            res.send(data)

            return
        }
        userData = userData.data[0]
        checkEmailExist = await db.findOneDocumentExists("user", { email: userData.email })
        if (checkEmailExist == true) {

            return ctx.response.body = { status: 0, response: "Email Already Exists" }
        }
        userData.password = await bcrypt.hash(userData.password, 10)
        userData.otp = common.otpGenerate()

        updateuserData = await db.findByIdAndUpdate("user", userData.id, userData)
        if (updateuserData.modifiedCount !== 0 && updateuserData.matchedCount !== 0) {
            await registrationOtpMail(
                {
                    emailTo: userData.email,
                    fullName: userData.fullName,
                    otp: userData.otp
                }
            )

            return ctx.response.body = { status: 1, response: "Registration data updated successfully" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - updateRegisterData:-${error.message}` }
    }
}

const resendOtp = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, userData, updateOtp, checkEmail;
    try {
        userData = ctx.request.body;
        if (Object.keys(userData).length === 0 && userData.data === undefined) {
            res.send(data)

            return
        }
        userData = userData.data[0]
        checkEmail = await db.findSingleDocument("user", { email: userData.email }, { fullName: 1 })
        if (checkEmail == null || Object.keys(checkEmail).length == 0) {

            return ctx.response.body = { status: 0, response: "Invalid User" }
        }

        userData.otp = common.otpGenerate()

        updateOtp = await db.findOneAndUpdate("user", { email: userData.email }, { otp: userData.otp })
        if (Object.keys(updateOtp).length !== 0) {
            await resendOtpMail(
                {
                    emailTo: userData.email,
                    fullName: checkEmail.fullName,
                    otp: userData.otp
                }
            )

            return ctx.response.body = { status: 1, response: "OTP sended sucessfully" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - updateRegisterData:-${error.message}` }
    }
}

const verifyOtp = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, otpData, checkOtp, changeUserstatus;
    try {
        otpData = ctx.request.body;
        if (Object.keys(otpData).length === 0 && otpData.data === undefined) {
            res.send(data)

            return
        }
        otpData = otpData.data[0]
        checkOtp = await db.findDocumentExist("user", { _id: new ObjectId(otpData.id), otp: otpData.otp, status: 2 })
        if (checkOtp == true) {
            changeUserstatus = await db.findByIdAndUpdate("user", otpData.id, { status: 1 })
            if (changeUserstatus.modifiedCount !== 0 && changeUserstatus.matchedCount !== 0) {

                return ctx.response.body = { status: 1, response: "OTP Verified successfully" }
            }

            return ctx.response.body = data
        }
        return ctx.response.body = { status: 1, response: "Invalid Request" }

    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - verifyOtp:-${error.message}` }
    }
}

const login = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, loginData, privateKey, checkEmail, generatedToken;
    try {
        loginData = ctx.request.body;
        if (Object.keys(loginData).length === 0 && loginData.data === undefined) {
            res.send(data)

            return
        }
        loginData = loginData.data[0]
        privateKey = await fs.readFile('privateKey.key', 'utf8');

        checkEmail = await db.findSingleDocument("user", { email: loginData.email, status: 1 })
        if (checkEmail == null || Object.keys(checkEmail).length == 0) {

            return ctx.response.body = { status: 0, response: "Invalid User" }
        }
        checkPasword = await bcrypt.compare(loginData.password, checkEmail.password)
        if (checkPasword === false) {

            return ctx.response.body = { status: 0, response: "Invalid Credentials" }
        }
        generatedToken = jwt.sign({
            userId: checkEmail._id,
            role: checkEmail.role,
            status: checkEmail.status,
        }, privateKey, { algorithm: 'RS256' })

        if (generatedToken) {

            return ctx.response.body = { status: 0, response: "LoggedIn successfully", data: generatedToken }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - login:-${error.message}` }
    }
}

const updateUserDetails = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, updateData, checkId, updateUserData;
    try {
        updateData = ctx.request.body;
        if (Object.keys(updateData).length === 0 && updateData.data === undefined) {
            res.send(data)

            return
        }
        updateData = updateData.data[0]

        checkId = await db.findSingleDocument("user", { _id: new ObjectId(updateData.id), status: 1 })
        if (checkId == null || Object.keys(checkId).length == 0) {

            return ctx.response.body = { status: 0, response: "Invalid id" }
        }
        updateUserData = await db.findByIdAndUpdate("user", updateData.id, updateData)
        if (updateUserData.modifiedCount !== 0 && updateUserData.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Profile updated Sucessfully" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - updateUserDetails:-${error.message}` }
    }
}

const userConnectionRequest = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, connectionData, checkId, insertConnection;
    try {
        connectionData = ctx.request.body;
        if (Object.keys(connectionData).length === 0 && connectionData.data === undefined) {
            res.send(data)

            return
        }
        connectionData = connectionData.data[0]

        checkSenderId = await db.findOneDocumentExists("user", { _id: new ObjectId(connectionData.senderId), status: 1 })
        if (checkSenderId == false) {

            return ctx.response.body = { status: 0, response: "Invalid id" }
        }
        checkRecipientId = await db.findOneDocumentExists("user", { _id: new ObjectId(connectionData.recipientId), status: 1 })
        if (checkRecipientId == false) {

            return ctx.response.body = { status: 0, response: "Invalid id" }
        }
        insertConnection = await db.insertSingleDocument("connection", connectionData)
        if (insertConnection) {

            return ctx.response.body = { status: 1, response: "Request Sent Sucessfully" }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - userConnectionRequest:-${error.message}` }
    }
}

const getProfileById = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, ProfileIdData, checkId, profileData, aggregationQuery;
    try {
        ProfileIdData = ctx.request.body;
        if (Object.keys(ProfileIdData).length === 0 && ProfileIdData.data === undefined) {
            res.send(data)

            return
        }
        ProfileIdData = ProfileIdData.data[0]

        checkId = await db.findOneDocumentExists("user", { _id: new ObjectId(ProfileIdData.id), status: 1 })
        if (checkId == false) {

            return ctx.response.body = { status: 0, response: "Invalid id" }
        }
        aggregationQuery = [
            {
                $match: {
                    _id: new ObjectId(ProfileIdData.id)
                }
            },
            {
                $lookup: {
                    from: 'connections',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        { $eq: ['$senderId', '$$userId'] },
                                        { $eq: ['$recipientId', '$$userId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'connectionData'
                }
            },
            {
                $unwind: '$connectionData'
            },
            {
                $group: {
                    _id: {
                        userId: '$_id',
                        status: '$connectionData.status'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.userId',
                    connectionCounts: {
                        $push: {
                            status: '$_id.status',
                            count: '$count'
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userData'
                }
            },
            {
                $unwind: '$userData'
            },
            {
                $project: {
                    'userData.password': 0 // Exclude the password field
                }
            }
        ];

        profileData = await db.getAggregation('user', aggregationQuery);

        return ctx.response.body = profileData
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - userConnectionRequest:-${error.message}` }
    }
}

const getAllUser = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, getData;
    try {
        getData = ctx.request.body;
        if (Object.keys(getData).length === 0 && getData.data === undefined) {
            res.send(data)

            return
        }
        getData = getData.data[0]

        getUserData = await db.findDocumentsWithPagination("user", {}, { password: 0, otp: 0, updatedAt: 0 }, getData.pageNumber, getData.pageLimit)
        if (getUserData) {

            return ctx.response.body = { status: 1, data: getUserData }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - getAllUser:-${error.message}` }
    }
}

const acceptConnectionRequest = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, updateConnectionData;
    try {
        updateConnectionData = ctx.request.body;
        if (Object.keys(updateConnectionData).length === 0 && updateConnectionData.data === undefined) {
            res.send(data)

            return
        }
        updateConnectionData = updateConnectionData.data[0]

        getUserData = await db.findDocumentsWithPagination("user", {}, { password: 0, otp: 0, updatedAt: 0 }, getData.pageNumber, getData.pageLimit)
        if (getUserData) {

            return ctx.response.body = { status: 1, data: getUserData }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - getAllUser:-${error.message}` }
    }
}

const navSearch = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, userData, pageData, aggregationQuery = [], searchData, pageDataCount, searchedInfo;
    try {
        searchData = ctx.request.body;
        if (Object.keys(searchData).length === 0 && searchData.data === undefined) {
            res.send(data)

            return
        }
        searchData = searchData.data[0]
        searchTerm = searchData.term.trim()
        userData = await db.findDocumentsWithLimit('user', {
            $or: [
                { fullName: { $regex: searchTerm, $options: 'i' } },
                { designation: { $regex: searchTerm, $options: 'i' } },
                { about: { $regex: searchTerm, $options: 'i' } }
            ]
        }, { fullName: 1, profile: 1 }, 10)

        pageData = await db.findDocumentsWithLimit('companyPage', {
            $or: [
                { companyName: { $regex: searchTerm, $options: 'i' } },
                { about: { $regex: searchTerm, $options: 'i' } }
            ]
        }, { companyName: 1, profile: 1 }, 10)
        if (userData.length > 9 || pageData.length === 0) {

            return ctx.response.body = { status: 1, data: userData }
        }
        if (userData.length === 0 && pageData.length !== 0) {

            return ctx.response.body = { status: 1, data: pageData }
        }
        pageDataCount = 10 - userData.length
        pageData = pageData.splice(0, pageDataCount)
        searchedInfo = [...userData, ...pageData]

        return ctx.response.body = { status: 1, data: searchedInfo }
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - userConnectionRequest:-${error.message}` }
    }
}


module.exports = {
    userRegister, updateRegisterData, resendOtp,
    login, verifyOtp, updateUserDetails, userConnectionRequest, getProfileById,
    getAllUser, acceptConnectionRequest, navSearch
}