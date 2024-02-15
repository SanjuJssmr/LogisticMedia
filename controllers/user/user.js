const db = require("../../model/mongodb")
const common = require("../../model/common")
const path = require('path')
const bcrypt = require("bcrypt")
const ejs = require('ejs')
const fs = require("fs").promises
const jwt = require("jsonwebtoken")
const { ObjectId } = require("bson")
const { transporter } = require('../../model/mail')
const CONFIG = require("../../config/config.json")
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
                otp: mailData.otp,
                type: mailData.type,
                url: mailData.url
            }
            , async (err, data) => {
                if (err) {
                    console.log(err);
                    await common.errorMail(errorData)
                } else {
                    mailOptions = {
                        from: process.env.SMTP_AUTH_USER,
                        to: mailData.emailTo,
                        subject: `AllMaster's SocialMedia | Registration Verification |OTP Confirmation`,
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

const userRegister = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, userData, checkEmailExist, userInsert, fileData, fileUrl, checkUserNameExist;
    try {
        userData = ctx.request.body;
        // if (Object.keys(userData).length === 0 && userData.data === undefined) {
        //     ctx.response.body = data

        //     return
        // }
        // userData = userData.data[0]
        fileData = ctx.request.files
        checkEmailExist = await db.findOneDocumentExists("user", { email: userData.email })
        if (checkEmailExist == true) {

            return ctx.response.body = { status: 0, response: "Email Already Exists" }
        }
        checkUserNameExist = await db.findOneDocumentExists("user", { userName: userData.userName })
        if (checkUserNameExist == true) {

            return ctx.response.body = { status: 0, response: "Username Already Exists" }
        }
        userData.password = await bcrypt.hash(userData.password, 10)
        userData.otp = common.otpGenerate()
        if (fileData.length !== 0) {
            userData.profile = await common.uploadBufferToAzureBlob(fileData[0], fileData[0].mimetype)
        }
        userInsert = await db.insertSingleDocument("user", userData)
        if (Object.keys(userInsert).length !== 0) {
            await registrationOtpMail(
                {
                    emailTo: userInsert.email,
                    fullName: userInsert.fullName,
                    otp: userInsert.otp,
                    type: "account",
                    url: CONFIG.settings.otpUrl + userInsert._id
                }
            )

            return ctx.response.body = { status: 1, response: "OTP send successfully", data: JSON.stringify(userInsert._id) }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - userRegister:-${error.message}` }
    }
}

const updateRegisterData = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, userData, checkEmailExist, updateuserData, fileData;
    try {
        userData = ctx.request.body;
        // if (Object.keys(userData).length === 0 && userData.data === undefined) {
        //     ctx.response.body = data

        //     return
        // }
        // userData = userData.data[0]
        fileData = ctx.request.files
        checkEmailExist = await db.findOneDocumentExists("user", { email: userData.email, _id: { $nin: new ObjectId(userData.id) } })
        if (checkEmailExist == true) {

            return ctx.response.body = { status: 0, response: "Email Already Exists" }
        }
        userData.password = await bcrypt.hash(userData.password, 10)
        userData.otp = common.otpGenerate()
        if (fileData.length !== 0) {
            userData.profile = await common.uploadBufferToAzureBlob(fileData[0], fileData[0].mimetype)
        }

        updateuserData = await db.findByIdAndUpdate("user", userData.id, userData)
        if (updateuserData.modifiedCount !== 0 && updateuserData.matchedCount !== 0) {
            await registrationOtpMail(
                {
                    emailTo: userData.email,
                    fullName: userData.fullName,
                    otp: userData.otp,
                    type: "account",
                    url: CONFIG.settings.otpUrl + userData.id
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

const userDetailsById = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, updateData, checkId;
    try {
        updateData = ctx.request.body;
        if (Object.keys(updateData).length === 0 && updateData.data === undefined) {
            ctx.response.body = data

            return
        }
        updateData = updateData.data[0]

        checkId = await db.findSingleDocument("user", { _id: new ObjectId(updateData.id), status: 2 }, { password: 0, otp: 0, createdAt: 0, updatedAt: 0 })
        if (checkId == null || Object.keys(checkId).length == 0) {

            return ctx.response.body = { status: 0, response: "Invalid id" }
        }
        return ctx.response.body = { status: 1, data: JSON.stringify(checkId) }
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - userDetailsById:-${error.message}` }
    }
}

const resendOtp = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, userData, updateOtp, checkEmail;
    try {
        userData = ctx.request.body;
        if (Object.keys(userData).length === 0 && userData.data === undefined) {
            ctx.response.body = data

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
            await registrationOtpMail(
                {
                    emailTo: userData.email,
                    fullName: checkEmail.fullName,
                    otp: userData.otp,
                    type: "account",
                    url: CONFIG.settings.otpUrl + checkEmail._id
                }
            )

            return ctx.response.body = { status: 1, response: "OTP send successfully" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - updateRegisterData:-${error.message}` }
    }
}

const verifyOtp = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, otpData, checkOtp, changeUserstatus, generatedToken, privateKey;
    try {
        otpData = ctx.request.body;
        if (Object.keys(otpData).length === 0 && otpData.data === undefined) {
            ctx.response.body = data

            return
        }
        otpData = otpData.data[0]
        privateKey = await fs.readFile('privateKey.key', 'utf8');
        checkOtp = await db.findSingleDocument("user", { _id: new ObjectId(otpData.id), otp: otpData.otp, status: 2 })
        if (checkOtp !== null) {
            changeUserstatus = await db.findByIdAndUpdate("user", otpData.id, { status: 1 })
            if (changeUserstatus.modifiedCount !== 0 && changeUserstatus.matchedCount !== 0) {
                generatedToken = jwt.sign({
                    userId: checkOtp._id,
                    role: checkOtp.role,
                    status: checkOtp.status,
                }, privateKey, { algorithm: 'RS256' })

                if (generatedToken) {

                    return ctx.response.body = { status: 1, response: "OTP Verified successfully", data: generatedToken }

                } else {
                    return ctx.response.body = { status: 1, response: "OTP Verified successfully" }
                }
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
            ctx.response.body = data

            return
        }
        loginData = loginData.data[0]
        privateKey = await fs.readFile('privateKey.key', 'utf8');

        checkEmail = await db.findSingleDocument("user", { email: loginData.email })
        if (checkEmail == null || Object.keys(checkEmail).length == 0) {

            return ctx.response.body = { status: 0, response: "Invalid Credentials" }
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

            return ctx.response.body = { status: 1, response: "LoggedIn successfully", data: generatedToken }
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
        // if (Object.keys(updateData).length === 0 && updateData.data === undefined) {
        //     ctx.response.body = data

        //     return
        // }
        // updateData = updateData.data[0]
        fileData = ctx.request.files

        checkId = await db.findSingleDocument("user", { _id: new ObjectId(updateData.id), status: 1 })
        if (checkId == null || Object.keys(checkId).length == 0) {

            return ctx.response.body = { status: 0, response: "Invalid id" }
        }
        if (fileData.length !== 0) {
            updateData.profile = await common.uploadBufferToAzureBlob(fileData[0], fileData[0].mimetype)
        }
        updateUserData = await db.findByIdAndUpdate("user", updateData.id, updateData)
        if (updateUserData.modifiedCount !== 0 && updateUserData.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Profile updated successfully" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - updateUserDetails:-${error.message}` }
    }
}

const userConnectionRequest = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, connectionData, checkConnection, insertConnection;
    try {
        connectionData = ctx.request.body;
        if (Object.keys(connectionData).length === 0 && connectionData.data === undefined) {
            ctx.response.body = data

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
        checkConnection = await db.findDocumentExist("connection", { senderId: new ObjectId(connectionData.senderId), recipientId: new ObjectId(connectionData.recipientId) })
        if (checkConnection == true) {
            updateConectionStatus = await db.findOneAndUpdate("connection", { senderId: new ObjectId(connectionData.senderId), recipientId: new ObjectId(connectionData.recipientId) }, { status: 2 })
            if (updateConectionStatus) {
                return ctx.response.body = { status: 1, response: "Request Sent successfully" }
            }
        }
        insertConnection = await db.insertSingleDocument("connection", connectionData)
        if (insertConnection) {

            return ctx.response.body = { status: 1, response: "Request Sent successfully" }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - userConnectionRequest:-${error.message}` }
    }
}

const getProfileById = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, ProfileIdData, checkId, profileData,
        getConnectionCount, postCount, getFowllersCount, getFowllingCount, pageDetails, getPagesFollowingCount;
    try {
        ProfileIdData = ctx.request.body;
        if (Object.keys(ProfileIdData).length === 0 && ProfileIdData.data === undefined) {
            ctx.response.body = data

            return
        }
        ProfileIdData = ProfileIdData.data[0]

        checkId = await db.findSingleDocument("user", { _id: new ObjectId(ProfileIdData.id), status: 1 }, { password: 0, otp: 0 })
        if (checkId == null || Object.keys(checkId).length == 0) {

            return ctx.response.body = { status: 0, response: "Invalid id" }
        }
        getConnectionCount = await db.getCountAsync('connection', {
            $or: [
                { senderId: new ObjectId(ProfileIdData.id), status: 1 },
                { recipientId: new ObjectId(ProfileIdData.id), status: 1 }
            ]
        })
        getFowllersCount = await db.getCountAsync('connection', { recipientId: new ObjectId(ProfileIdData.id), status: { $in: [2] } })
        getFowllingCount = await db.getCountAsync('connection', { senderId: new ObjectId(ProfileIdData.id), status: { $in: [2] } })
        getPagesFollowingCount = await db.getCountAsync('follower', { followerId: new ObjectId(ProfileIdData.id), status: 1 })
        postCount = await db.getCountAsync("post", { createdBy: new ObjectId(ProfileIdData.id), status: 1 })
        pageDetails = await db.findSingleDocument("companyPage", { createdBy: new ObjectId(ProfileIdData.id) }, { updateAt: 0 })

        profileData =
        {
            "detailsCounts": {
                "postCount": postCount,
                "followersCount": getFowllersCount + getConnectionCount,
                "followingCount": getFowllingCount + getPagesFollowingCount + getConnectionCount,
                "connectionCount": getConnectionCount
            },
            "userData": checkId,
            "pageData": pageDetails
        }

        return ctx.response.body = { status: 1, data: JSON.stringify(profileData) }
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - userConnectionRequest:-${error.message}` }
    }
}

const getAllUser = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, getData, allData;
    try {
        getData = ctx.request.body;
        if (Object.keys(getData).length === 0 && getData.data === undefined) {
            ctx.response.body = data

            return
        }
        getData = getData.data[0]

        getUserData = await db.findDocumentsWithPagination("user", { role: 1 }, { password: 0, otp: 0, updatedAt: 0 }, getData.pageNumber, getData.pageLimit)
        if (getUserData) {
            userCount = await db.getCountAsync('user', {})
            allData = {
                userData: getUserData,
                userCount: userCount
            }

            return ctx.response.body = { status: 1, data: JSON.stringify(allData) }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - getAllUser:-${error.message}` }
    }
}

const changeConnectionStatus = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, updateConnectionData, updateConnectionStatus;
    try {
        updateConnectionData = ctx.request.body;
        if (Object.keys(updateConnectionData).length === 0 && updateConnectionData.data === undefined) {
            ctx.response.body = data

            return
        }
        updateConnectionData = updateConnectionData.data[0]
        if (updateConnectionData.status == 1) {
            updateConnectionStatus = await db.findByIdAndUpdate("connection", updateConnectionData.id, { status: 1, connected: 1 })
            if (updateConnectionStatus.modifiedCount !== 0 && updateConnectionStatus.matchedCount !== 0) {

                return ctx.response.body = { status: 1, response: "updated successfully" }
            }
        }

        updateConnectionStatus = await db.findByIdAndUpdate("connection", updateConnectionData.id, { status: updateConnectionData.status })
        if (updateConnectionStatus.modifiedCount !== 0 && updateConnectionStatus.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "updated successfully" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - getAllUser:-${error.message}` }
    }
}

const getConnectionRequestListById = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, updateConnectionData, aggregationQuery, requestData;
    try {
        updateConnectionData = ctx.request.body;
        if (Object.keys(updateConnectionData).length === 0 && updateConnectionData.data === undefined) {
            ctx.response.body = data

            return
        }
        updateConnectionData = updateConnectionData.data[0]

        aggregationQuery = [
            { $match: { status: 2, recipientId: new ObjectId(updateConnectionData.id) } },
            {
                $lookup: {
                    from: "users",
                    localField: "senderId",
                    foreignField: "_id",
                    as: "senderData"
                }

            },
            {
                $lookup: {
                    from: "users",
                    localField: "recipientId",
                    foreignField: "_id",
                    as: "recipientData"
                }
            },
            {
                $project: {
                    _id: 1,
                    senderId: 1,
                    senderName: { '$arrayElemAt': ['$senderData.fullName', 0] },
                    senderProfile: { '$arrayElemAt': ['$senderData.profile', 0] },
                    recipientId: 1,
                    recipientName: { '$arrayElemAt': ['$recipientData.fullName', 0] },
                    recipientProfile: { '$arrayElemAt': ['$recipientData.profile', 0] },
                    status: 1,
                    createdAt: 1,
                }
            }
        ]

        requestData = await db.getAggregation('connection', aggregationQuery)
        if (requestData) {

            return ctx.response.body = { status: 1, data: JSON.stringify(requestData) }
        }
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - getConnectionListById:-${error.message}` }
    }
}

const getFollowListByUserId = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, userData, aggregationQuery, followData,
        connectedAggregationQuery, conectionData;
    try {
        userData = ctx.request.body;
        if (Object.keys(userData).length === 0 && userData.data === undefined) {
            ctx.response.body = data

            return
        }
        userData = userData.data[0]

        aggregationQuery = [
            { $match: { recipientId: new ObjectId(userData.id), status: { $in: [2] } } },
            {
                $lookup: {
                    from: "users",
                    localField: "senderId",
                    foreignField: "_id",
                    as: "senderData"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "recipientId",
                    foreignField: "_id",
                    as: "recipientData"
                }
            },
            {
                $project: {
                    _id: 1,
                    senderId: 1,
                    senderName: { '$arrayElemAt': ['$senderData.fullName', 0] },
                    senderProfile: { '$arrayElemAt': ['$senderData.profile', 0] },
                    recipientId: 1,
                    recipientName: { '$arrayElemAt': ['$recipientData.fullName', 0] },
                    recipientProfile: { '$arrayElemAt': ['$recipientData.profile', 0] },
                    status: 1,
                    createdAt: 1,
                }
            }
        ]
        connectedAggregationQuery = [
            {
                $match: {
                    $or: [
                        { senderId: new ObjectId(userData.id), status: 1 },
                        { recipientId: new ObjectId(userData.id), status: 1 }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "senderId",
                    foreignField: "_id",
                    as: "senderData"
                }

            },
            {
                $lookup: {
                    from: "users",
                    localField: "recipientId",
                    foreignField: "_id",
                    as: "recipientData"
                }
            },
            {
                $project: {
                    _id: 1,
                    senderId: 1,
                    senderName: { '$arrayElemAt': ['$senderData.fullName', 0] },
                    senderProfile: { '$arrayElemAt': ['$senderData.profile', 0] },
                    recipientId: 1,
                    recipientName: { '$arrayElemAt': ['$recipientData.fullName', 0] },
                    recipientProfile: { '$arrayElemAt': ['$recipientData.profile', 0] },
                    status: 1,
                    createdAt: 1,
                }
            }
        ]

        conectionData = await db.getAggregation('connection', connectedAggregationQuery)

        followData = await db.getAggregation('connection', aggregationQuery)
        followData = [...followData, ...conectionData]
        if (followData) {

            return ctx.response.body = { status: 1, data: JSON.stringify(followData) }
        }
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - getFollowListByUserId:-${error.message}` }
    }
}

const getConnectionListByUserId = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, userData, aggregationQuery, conectionData;
    try {
        userData = ctx.request.body;
        if (Object.keys(userData).length === 0 && userData.data === undefined) {
            ctx.response.body = data

            return
        }
        userData = userData.data[0]

        aggregationQuery = [
            {
                $match: {
                    $or: [
                        { senderId: new ObjectId(userData.id), status: 1 },
                        { recipientId: new ObjectId(userData.id), status: 1 }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "senderId",
                    foreignField: "_id",
                    as: "senderData"
                }

            },
            {
                $lookup: {
                    from: "users",
                    localField: "recipientId",
                    foreignField: "_id",
                    as: "recipientData"
                }
            },
            {
                $project: {
                    _id: 1,
                    senderId: 1,
                    senderName: { '$arrayElemAt': ['$senderData.fullName', 0] },
                    senderProfile: { '$arrayElemAt': ['$senderData.profile', 0] },
                    recipientId: 1,
                    recipientName: { '$arrayElemAt': ['$recipientData.fullName', 0] },
                    recipientProfile: { '$arrayElemAt': ['$recipientData.profile', 0] },
                    status: 1,
                    createdAt: 1,
                }
            }
        ]

        conectionData = await db.getAggregation('connection', aggregationQuery)
        if (conectionData) {

            return ctx.response.body = { status: 1, data: JSON.stringify(conectionData) }
        }
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - getFollowingListByUserId:-${error.message}` }
    }
}

const getFollowingListByUserId = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, userData, userAggregationQuery, followingData,
        pageAggregationQuery, userfollowingData, pagefollowinData, allData = [], conectionData, connectedAggregationQuery;
    try {
        userData = ctx.request.body;
        if (Object.keys(userData).length === 0 && userData.data === undefined) {
            ctx.response.body = data

            return
        }
        userData = userData.data[0]

        userAggregationQuery = [
            { $match: { senderId: new ObjectId(userData.id), status: { $in: [2] } } },
            {
                $lookup: {
                    from: "users",
                    localField: "senderId",
                    foreignField: "_id",
                    as: "senderData"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "recipientId",
                    foreignField: "_id",
                    as: "recipientData"
                }
            },
            {
                $project: {
                    _id: 1,
                    senderId: 1,
                    senderName: { '$arrayElemAt': ['$senderData.fullName', 0] },
                    senderProfile: { '$arrayElemAt': ['$senderData.profile', 0] },
                    recipientId: 1,
                    recipientName: { '$arrayElemAt': ['$recipientData.fullName', 0] },
                    recipientProfile: { '$arrayElemAt': ['$recipientData.profile', 0] },
                    status: 1,
                    createdAt: 1,
                }
            }
        ]

        pageAggregationQuery = [
            { $match: { followerId: new ObjectId(userData.id), status: 1 } },
            {
                $lookup: {
                    from: "companypages",
                    localField: "companyId",
                    foreignField: "_id",
                    as: "companyData"
                }

            },
            {
                $project: {
                    _id: 1,
                    followerId: 1,
                    companyId: 1,
                    followerName: { '$arrayElemAt': ['$companyData.companyName', 0] },
                    profile: { '$arrayElemAt': ['$companyData.profile', 0] },
                    status: 1,
                    createdAt: 1
                }
            }
        ]
        connectedAggregationQuery = [
            {
                $match: {
                    $or: [
                        { senderId: new ObjectId(userData.id), status: 1 },
                        { recipientId: new ObjectId(userData.id), status: 1 }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "senderId",
                    foreignField: "_id",
                    as: "senderData"
                }

            },
            {
                $lookup: {
                    from: "users",
                    localField: "recipientId",
                    foreignField: "_id",
                    as: "recipientData"
                }
            },
            {
                $project: {
                    _id: 1,
                    senderId: 1,
                    senderName: { '$arrayElemAt': ['$senderData.fullName', 0] },
                    senderProfile: { '$arrayElemAt': ['$senderData.profile', 0] },
                    recipientId: 1,
                    recipientName: { '$arrayElemAt': ['$recipientData.fullName', 0] },
                    recipientProfile: { '$arrayElemAt': ['$recipientData.profile', 0] },
                    status: 1,
                    createdAt: 1,
                }
            }
        ]

        conectionData = await db.getAggregation('connection', connectedAggregationQuery)
        userfollowingData = await db.getAggregation('connection', userAggregationQuery)
        pagefollowinData = await db.getAggregation('follower', pageAggregationQuery)
        allData = [...userfollowingData, ...pagefollowinData, ...conectionData]
        if (allData) {

            return ctx.response.body = { status: 1, data: JSON.stringify(allData) }
        }
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - getConnectionListByUserId:-${error.message}` }
    }
}

const navSearch = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, userData, pageData, aggregationQuery = [], searchData, pageDataCount, searchedInfo;
    try {
        searchData = ctx.request.body;
        if (Object.keys(searchData).length === 0 && searchData.data === undefined) {
            ctx.response.body = data

            return
        }
        searchData = searchData.data[0]
        searchTerm = searchData.term.trim()
        userData = await db.findDocumentsWithLimit('user', {
            status: 1,
            role: 1,
            $or: [
                { fullName: { $regex: searchTerm, $options: 'i' } },
                { designation: { $regex: searchTerm, $options: 'i' } },
                { about: { $regex: searchTerm, $options: 'i' } }
            ]
        }, { fullName: 1, profile: 1, userName: 1 }, 10)

        pageData = await db.findDocumentsWithLimit('companyPage', {
            status: 1,
            $or: [

                { companyName: { $regex: searchTerm, $options: 'i' } },
                { about: { $regex: searchTerm, $options: 'i' } }
            ]
        }, { companyName: 1, profile: 1 }, 10)
        if (userData.length > 9 || pageData.length === 0) {

            return ctx.response.body = { status: 1, data: JSON.stringify(userData) }
        }
        if (userData.length === 0 && pageData.length !== 0) {

            return ctx.response.body = { status: 1, data: JSON.stringify(pageData) }
        }
        pageDataCount = 10 - userData.length
        pageData = pageData.splice(0, pageDataCount)
        searchedInfo = [...userData, ...pageData]

        return ctx.response.body = { status: 1, data: JSON.stringify(searchedInfo) }
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - userConnectionRequest:-${error.message}` }
    }
}

const getMyNotifications = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, userData, notificationInfo, aggregationQuery = []
    try {
        userData = ctx.request.body;
        if (Object.keys(userData).length === 0 && userData.data === undefined) {
            ctx.response.body = data

            return
        }
        userData = userData.data[0]
        aggregationQuery = [
            {
                $match: {
                    $and: [
                        { category: { $ne: 0 } },
                        { receiverId: new ObjectId(userData.userId) }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "senderId",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            {
                $replaceRoot: { newRoot: { $mergeObjects: [{ fullName: "$userInfo.fullName", profile: "$userInfo.profile" }, "$$ROOT"] } }
            },
            {
                $addFields: {
                    userName: { $arrayElemAt: ["$fullName", 0] },
                    userProfile: { $arrayElemAt: ["$profile", 0] }
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $project: {
                    postId: 1,
                    userProfile: 1,
                    userName: 1,
                    category: 1,
                    commentId: 1,
                    createdAt: 1,
                    status: 1
                },
            },
            {
                $facet: {
                    data: [
                        { $skip: (userData.page - 1) * userData.pageSize },
                        { $limit: userData.pageSize }
                    ],
                    totalCount: [
                        { $count: "value" }
                    ],
                    unseenCount: [
                        { $match: { "status": 1 } },
                        { $count: "value" }
                    ]
                }
            }
        ]
        notificationInfo = await db.getAggregation("notification", aggregationQuery)

        if (notificationInfo[0].data.length !== 0) {
            if (notificationInfo[0].unseenCount.length !== 0) {

                return ctx.response.body = { status: 1, data: JSON.stringify(notificationInfo[0].data), totalCount: notificationInfo[0].totalCount[0].value, unseenCount: notificationInfo[0].unseenCount[0].value }
            }

            return ctx.response.body = { status: 1, data: JSON.stringify(notificationInfo[0].data), totalCount: notificationInfo[0].totalCount[0].value, unseenCount: 0 }
        }

        return ctx.response.body = { status: 1, data: JSON.stringify(notificationInfo[0].data), totalCount: 0, unseenCount: 0 }
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - getMyNotifications:-${error.message}` }
    }
}

const updateNotification = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, notificationData, updateNotificationStatus;
    try {
        notificationData = ctx.request.body;
        if (Object.keys(notificationData).length === 0 && notificationData.data === undefined) {
            ctx.response.body = data

            return
        }
        notificationData = notificationData.data[0]
        updateNotificationStatus = await db.updateOneDocument("notification", { _id: notificationData.id }, { status: 2 })
        if (updateNotificationStatus.modifiedCount !== 0 && updateNotificationStatus.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Notification updated successfully" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - updateNotification:-${error.message}` }
    }
}

const userSearch = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, userData, pageData, searchData, pageDataCount, searchedInfo;
    try {
        searchData = ctx.request.body;
        if (Object.keys(searchData).length === 0 && searchData.data === undefined) {
            ctx.response.body = data

            return
        }
        searchData = searchData.data[0]
        searchTerm = searchData.term.trim()
        userData = await db.findDocumentsWithLimit('user', {
            status: 1,
            role: 1,
            $or: [
                { fullName: { $regex: searchTerm, $options: 'i' } },
            ]
        }, { fullName: 1, profile: 1, userName: 1 }, 5)

        return ctx.response.body = { status: 1, data: JSON.stringify(userData) }
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - userConnectionRequest:-${error.message}` }
    }
}

// const getProfileByName = async (ctx) => {
//     let data = { status: 0, response: "Something went wrong" }, profileData, profileInfo, aggregationQuery = [];
//     try {
//         profileData = ctx.request.body;
//         if (Object.keys(profileData).length === 0 && profileData.data === undefined) {
//             ctx.response.body = data

//             return
//         }
//         profileData = profileData.data[0]
//         aggregationQuery = [
//             {
//                 $match: {
//                     userName: profileData.userName, status: 1
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "connections",
//                     let: { userId: "$_id" },
//                     pipeline: [
//                         {
//                             $match: {
//                                 $expr: {
//                                     $or: [{ $eq: ["$recipientId", "$$userId"] }, { $eq: ["$senderId", "$$userId"] }]
//                                 }
//                             }
//                         },
//                         {
//                             $group:
//                             {
//                                 _id: null,
//                                 followersCount: {
//                                     $sum: {
//                                         $cond: {
//                                             if: { $and: [{ $eq: ["$status", 2] }, { $eq: ["$recipientId", "$$userId"] }] },
//                                             then: 1,
//                                             else: 0
//                                         }
//                                     }
//                                 },
//                                 followingCount: {
//                                     $sum: {
//                                         $cond: {
//                                             if: { $and: [{ $eq: ["$status", 2] }, { $eq: ["$senderId", "$$userId"] }] },
//                                             then: 1,
//                                             else: 0
//                                         }
//                                     }
//                                 },
//                                 connectionCount: {
//                                     $sum: {
//                                         $cond: {
//                                             if: { $eq: ["$status", 1] },
//                                             then: 1,
//                                             else: 0
//                                         }
//                                     }
//                                 }
//                             }
//                         },
//                         {
//                             $project: {
//                                 _id: 0,
//                                 connectionCount: 1,
//                                 followingCount: { $add: ["$followingCount", "$connectionCount"] },
//                                 followersCount: { $add: ["$followersCount", "$connectionCount"] }
//                             }
//                         },
//                     ],
//                     as: "connectionInfo"
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "posts",
//                     let: { userId: "$_id" },
//                     pipeline: [
//                         {
//                             $match: {
//                                 $expr: {
//                                     $and: [{ $eq: ["$status", 1] }, { $eq: ["$createdBy", "$$userId"] }]
//                                 }
//                             }
//                         },
//                         {
//                             $count: "postCount"
//                         }
//                     ],
//                     as: "postData"
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "companypages",
//                     let: { userId: "$_id" },
//                     pipeline: [
//                         {
//                             $match: {
//                                 $expr: {
//                                     $eq: ["$createdBy", "$$userId"]
//                                 }
//                             }
//                         }
//                     ],
//                     as: "pageData"
//                 }
//             },
//             {
//                 $project: {
//                     "detailsCounts": {
//                         "postCount": { "$arrayElemAt": ["$postData.postCount", 0] },
//                         "followersCount": { "$arrayElemAt": ["$connectionInfo.followersCount", 0] },
//                         "followingCount": { "$arrayElemAt": ["$connectionInfo.followingCount", 0] },
//                         "connectionCount": { "$arrayElemAt": ["$connectionInfo.connectionCount", 0] }
//                     },
//                     "userData": {
//                         "_id": "$_id",
//                         "fullName": "$fullName",
//                         "userName": "$userName",
//                         "email": "$email",
//                         "designation": "$designation",
//                         "profile": "$profile",
//                         "state": "$state",
//                         "country": "$country",
//                         "dob": "$dob"
//                     },
//                     "pageData": { "$arrayElemAt": ["$pageData", 0] }
//                 }
//             }
//         ]
//         profileInfo = await db.getAggregation("user", aggregationQuery)

//         return ctx.response.body = { status: 1, data: JSON.stringify(profileInfo) }
//     } catch (error) {
//         console.log(error.message)
//         return ctx.response.body = { status: 0, response: `Error in user Controller - getProfileByName:-${error.message}` }
//     }
// }

const getProfileByName = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, profileData, profileInfo, aggregationQuery = [];
    try {
        profileData = ctx.request.body;
        if (Object.keys(profileData).length === 0 && profileData.data === undefined) {
            ctx.response.body = data

            return
        }
        profileData = profileData.data[0]
        profileInfo = await db.findSingleDocument("user", { userName: profileData.userName, status: 1 }, { _id: 1 })

        return ctx.response.body = { status: 1, data: JSON.stringify([{ userData: { _id: profileInfo._id } }]) }
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - getProfileByName:-${error.message}` }
    }
}

const getAllNotificationCount = async (ctx) => {
    let data = { status: 0, response: "Something went wrong" }, aggregationPostQuery = [], aggregationMentionQuery = [], totalNotificationCount, userData, postNotification, mentionNotification;
    try {
        userData = ctx.request.body;
        userData = userData.data[0]
        aggregationPostQuery = [
            {
                $match: {
                    $and: [
                        { category: { $ne: 0 } },
                        { receiverId: new ObjectId(userData.userId) },
                        { status: 1 }
                    ]
                }
            },
            {
                $count: "postNotificationTotal"
            }
        ]
        aggregationMentionQuery = [
            { $match: { $and: [{ "postMentions.userName": { $in: [userData.userName] } }, { "postMentions.status": { $in: [1] } }] } },
            {
                $count: "mentionNotificationTotal"
            }
        ]
        postNotification = await db.getAggregation("notification", aggregationPostQuery)
        mentionNotification = await db.getAggregation("post", aggregationMentionQuery)
        totalNotificationCount = postNotification[0].postNotificationTotal + mentionNotification[0].mentionNotificationTotal
        return ctx.response.body = { status: 1, totalNotificationCount: totalNotificationCount }
    } catch (error) {
        console.log(error.message)
        return ctx.response.body = { status: 0, response: `Error in user Controller - getAllNotificationCount:-${error.message}` }
    }
}

module.exports = {
    userRegister, updateRegisterData, resendOtp,
    login, verifyOtp, updateUserDetails, userConnectionRequest, getProfileById,
    getAllUser, changeConnectionStatus, getConnectionRequestListById, getFollowListByUserId, getFollowingListByUserId,
    getConnectionListByUserId, userDetailsById, navSearch, getMyNotifications, updateNotification, userSearch, getProfileByName,
    getAllNotificationCount
}