const mongoose = require("mongoose");
const db = require("../../model/mongodb")
const ObjectId = mongoose.Types.ObjectId
const fs = require("fs")

const addSchedule = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let scheduleData = ctx.request.body, scheduleInfo, likeInfo;
        scheduleData = scheduleData.data[0];
        scheduleInfo = await db.insertSingleDocument("schedule", scheduleData)
        if (Object.keys(scheduleInfo).length !== 0) {
            likeInfo = await db.insertSingleDocument("scheduleLike", { scheduleId: scheduleInfo._id })
            if (Object.keys(likeInfo).length !== 0) {

                return ctx.response.body = { status: 1, response: "Schedule added successfully" }
            }
            return ctx.response.body = data
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in schedule controllers - ${error.message}` }
    }
}

const deleteSchedule = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let scheduleData = ctx.request.body, scheduleInfo, updateInfo;
        scheduleData = scheduleData.data[0];
        scheduleInfo = await db.findSingleDocument("schedule", { _id: scheduleData.scheduleId, companyId: scheduleData.companyId })
        if (scheduleInfo == null || scheduleInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No schedule found" }
        }

        updateInfo = await db.updateOneDocument("schedule", { _id: scheduleInfo._id }, { status: 0 })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Schedule deleted successfully" }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in schedule controllers - ${error.message}` }
    }
}

const getMySchedule = async (ctx) => {
    try {
        let scheduleData = ctx.request.body, scheduleInfo, aggregationQuery = [];
        scheduleData = scheduleData.data[0];
        aggregationQuery = [
            {
                $match: { status: 1, companyId: new ObjectId(scheduleData.companyId) },
            },
            {
                $lookup:
                {
                    from: "companypages",
                    localField: "companyId",
                    foreignField: "_id",
                    as: "companyInfo",
                }
            },
            {
                $lookup:
                {
                    from: "schedulelikes",
                    localField: "_id",
                    foreignField: "scheduleId",
                    as: "scheduleInfo",
                }
            },
            {
                $addFields: {
                    likedBy: "$scheduleInfo.likedBy",
                    fullName: "$companyInfo.companyName",
                    profile: "$companyInfo.profile"
                }
            },
            {
                $project: {
                    "pol": 1,
                    "pod": 1,
                    "openingOn": 1,
                    "bookingCutOff": 1,
                    "createdBy": 1,
                    "description": 1,
                    "createdAt": 1,
                    "companyName": { '$arrayElemAt': ['$fullName', 0] },
                    "companyProfile": { '$arrayElemAt': ['$profile', 0] },
                    'likedBy': { '$arrayElemAt': ['$likedBy', 0] },
                }
            },
            {
                $addFields: {
                    likes: { $size: "$likedBy" }
                }
            },
            {
                $sort: {
                    createdAt: -1,
                }
            }
        ]
        scheduleInfo = await db.getAggregation("schedule", aggregationQuery)

        return ctx.response.body = { status: 1, data: JSON.stringify(scheduleInfo) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in schedule controllers - ${error.message}` }
    }
}

const getScheduleById = async (ctx) => {
    try {
        let scheduleData = ctx.request.body, scheduleInfo, aggregationQuery = [];
        scheduleData = scheduleData.data[0]
        aggregationQuery = [
            { $match: { $and: [{ _id: new ObjectId(scheduleData.companyId) }, { status: 1 }] } },
            {
                $lookup:
                {
                    from: "companypages",
                    localField: "companyId",
                    foreignField: "_id",
                    as: "companyInfo",
                }
            },
            {
                $lookup:
                {
                    from: "schedulelikes",
                    localField: "_id",
                    foreignField: "scheduleId",
                    as: "scheduleInfo",
                }
            },
            {
                $addFields: {
                    likedBy: "$scheduleInfo.likedBy",
                    fullName: "$companyInfo.companyName",
                    profile: "$companyInfo.profile"
                }
            },
            {
                $project: {
                    "pol": 1,
                    "pod": 1,
                    "openingOn": 1,
                    "bookingCutOff": 1,
                    "createdBy": 1,
                    "description": 1,
                    "createdAt": 1,
                    "companyName": { '$arrayElemAt': ['$fullName', 0] },
                    "companyProfile": { '$arrayElemAt': ['$profile', 0] },
                    'likedBy': { '$arrayElemAt': ['$likedBy', 0] },
                }
            },
            {
                $addFields: {
                    likes: { $size: "$likedBy" }
                }
            },
        ]
        scheduleInfo = await db.getAggregation("schedule", aggregationQuery)

        return ctx.response.body = { status: 1, data: JSON.stringify(scheduleInfo) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers - ${error.message}` }
    }
}

const postComment = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let commentData = ctx.request.body, scheduleInfo, commentInfo;
        commentData = commentData.data[0];
        scheduleInfo = await db.findSingleDocument("schedule", { _id: commentData.scheduleId })
        if (scheduleInfo == null || scheduleInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No schedule found" }
        }
        scheduleInfo = await db.insertSingleDocument("scheduleComment", commentData)
        if (Object.keys(scheduleInfo).length !== 0) {

            return ctx.response.body = { status: 1, response: "Comment added successfully" }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in schedule controllers - ${error.message}` }
    }
}

const deleteComment = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let commentData = ctx.request.body, commentInfo, updateInfo;
        commentData = commentData.data[0];
        commentInfo = await db.findSingleDocument("scheduleComment", { _id: commentData.commentId, userId: commentData.userId })
        if (commentInfo == null || commentInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No comment found" }
        }
        updateInfo = await db.updateOneDocument("scheduleComment", { _id: commentInfo._id }, { status: 0 })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Comment deleted successfully" }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in schedule controllers - ${error.message}` }
    }
}

const addReply = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let replyData = ctx.request.body, commentInfo, updateInfo;
        replyData = replyData.data[0];
        commentInfo = await db.findSingleDocument("scheduleComment", { _id: replyData.commentId })
        if (commentInfo == null || commentInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No comment found" }
        }
        updateInfo = await db.updateOneDocument("scheduleComment", { _id: commentInfo._id }, { $push: { replies: { userReplied: replyData.userId, message: replyData.message } } })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Reply added successfully" }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in schedule controllers - ${error.message}` }
    }
}

const deleteReply = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let replyData = ctx.request.body, commentInfo, updateInfo, replyInfo, userInfo;
        replyData = replyData.data[0];
        commentInfo = await db.findSingleDocument("scheduleComment", { _id: replyData.commentId })
        if (commentInfo == null || commentInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No comment found" }
        }
        replyInfo = await db.findSingleDocument("scheduleComment", { _id: replyData.commentId, replies: { $elemMatch: { _id: replyData.replyId, userReplied: replyData.userId, status: 1 } } })
        if (replyInfo == null) {

            return ctx.response.body = { status: 1, response: "No reply found" }
        }
        updateInfo = await db.updateOneDocument("scheduleComment", { _id: commentInfo._id, "replies._id": replyData.replyId }, { "replies.$.status": 0 })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Reply deleted successfully" }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in schedule controllers - ${error.message}` }
    }
}

const getCommentsAndReplies = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let scheduleData = ctx.request.body, scheduleInfo, commentAndReplies, aggregationQuery = [];
        scheduleData = scheduleData.data[0];
        scheduleInfo = await db.findSingleDocument("schedule", { _id: scheduleData.scheduleId, status: 1 })
        if (scheduleInfo == null || scheduleInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No schedule found" }
        }
        aggregationQuery = [
            { $match: { $and: [{ scheduleId: new ObjectId(scheduleData.scheduleId) }, { status: 1 }] } },
            {
                $lookup:
                {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userData",
                }
            },
            {
                $replaceRoot: { newRoot: { $mergeObjects: [{ fullName: "$userData.fullName", designation: "$userData.designation", profile: "$userData.profile" }, "$$ROOT"] } }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: "replies.userReplied",
                    foreignField: "_id",
                    as: 'replyUser'
                }
            },
            { $unset: ["replyUser.email", "replyUser.otp", "replyUser.state", "replyUser.country", "replyUser.role", "replyUser.status", "replyUser.password", "replyUser.dob", "replyUser.createdAt", "replyUser.updatedAt"] },
            {
                $addFields: {
                    "replies": {
                        $map: {
                            input: "$replies",
                            as: "reply",
                            in: {
                                $mergeObjects: [
                                    "$$reply",
                                    {
                                        userInfo: {
                                            $arrayElemAt: ["$replyUser", {
                                                $indexOfArray: ["$replyUser._id", "$$reply.userReplied"]
                                            }]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    "userRepliedInfo": { $map: { input: "$userRepliedInfo", as: "user", in: { fullName: "$$user.fullName" } } },
                }
            },
            { $unset: ["replies.userInfo._id"] },
            {
                $project: {
                    "userId": "$userId",
                    "message": "$message",
                    "commentedOn": "$commentedOn",
                    "userInfo": {
                        'fullName': { '$arrayElemAt': ['$fullName', 0] },
                        'designation': { '$arrayElemAt': ['$designation', 0] },
                        'profile': { '$arrayElemAt': ['$profile', 0] },
                    },
                    "replies": {
                        $filter: {
                            input: "$replies",
                            as: "reply",
                            cond: { $eq: ["$$reply.status", 1] }
                        }
                    }
                }
            }
        ]
        commentAndReplies = await db.getAggregation("scheduleComment", aggregationQuery)

        return ctx.response.body = { status: 0, data: JSON.stringify(commentAndReplies) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in post controllers - ${error.message}` }
    }
}

const updateLike = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let scheduleData = ctx.request.body, scheduleInfo, likeInfo;
        scheduleData = scheduleData.data[0];
        scheduleInfo = await db.findSingleDocument("scheduleLike", { scheduleId: scheduleData.scheduleId })
        if (scheduleInfo == null || scheduleInfo.status === 0) {

            return ctx.response.body = { status: 0, response: "No schedule found" }
        }
        if (scheduleData.status === 1) {
            updateInfo = await db.updateOneDocument("scheduleLike", { _id: scheduleInfo._id }, { $push: { likedBy: scheduleData.userId } })
            if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

                return ctx.response.body = { status: 1, response: "Like added successfully" }
            }
        }
        if (scheduleData.status === 2) {
            updateInfo = await db.updateOneDocument("scheduleLike", { _id: scheduleInfo._id }, { $pull: { likedBy: scheduleData.userId } })
            if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

                return ctx.response.body = { status: 1, response: "Disliked successfully" }
            }
        }

        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in schedule controllers - ${error.message}` }
    }
}

module.exports = { addSchedule, deleteSchedule, getMySchedule, getScheduleById, postComment, getCommentsAndReplies,
    deleteComment, addReply, deleteReply, updateLike }