const mongoose = require("mongoose");
const db = require("../../model/mongodb")
const ObjectId = mongoose.Types.ObjectId

const getAllChatInfo = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let connectionData = ctx.request.body, chatInfo, aggregationQuery = [];
        if (Object.keys(connectionData).length === 0 && connectionData.data === undefined) {
            ctx.response.body = data

            return
        }
        connectionData = connectionData.data[0]
        aggregationQuery = [
            {
                $match: {
                    $or: [
                        { connected: 1 }
                    ]
                }
            },
            {
                $match: {
                    $or: [
                        { senderId: new ObjectId(connectionData.userId) },
                        { recipientId: new ObjectId(connectionData.userId) }
                    ]
                }
            },
            {
                $lookup:
                {
                    from: "users",
                    localField: "senderId",
                    foreignField: "_id",
                    as: "senderInfo",
                }
            },
            {
                $lookup:
                {
                    from: "users",
                    localField: "recipientId",
                    foreignField: "_id",
                    as: "recipientInfo",
                }
            },
            {
                $addFields: {
                    "senderName": "$senderInfo.fullName",
                    "senderProfile": "$senderInfo.profile",
                    "recipientName": "$recipientInfo.fullName",
                    "recipientProfile": "$recipientInfo.profile"
                }
            },
            {
                $lookup:
                {
                    from: "chats",
                    localField: "_id",
                    foreignField: "connectionId",
                    as: "chatInfo",
                }
            },
            {
                $addFields: {
                    "recentChat": { $arrayElemAt: ["$chatInfo", -1] }
                }
            },
            {
                $sort: {
                    "chatInfo.createdAt": -1
                }
            },
            {
                $project: {
                    "_id": "$_id",
                    "senderId": "$senderId",
                    "senderName": { '$arrayElemAt': ['$senderName', 0] },
                    "recipientName": { '$arrayElemAt': ['$recipientName', 0] },
                    "senderProfile": { '$arrayElemAt': ['$senderProfile', 0] },
                    "recipientProfile": { '$arrayElemAt': ['$recipientProfile', 0] },
                    "recipientId": "$recipientId",
                    "recentChat": "$recentChat.message",
                    "recentTime": "$recentChat.createdAt",
                    "recentChatStatus":"$recentChat.status",
                    "chatInfo": {
                        $filter: {
                            input: "$chatInfo",
                            as: "chat",
                            cond: { $and: [{ $eq: ["$$chat.status", 0] }, { $ne: ["$$chat.sender", new ObjectId(connectionData.userId)] }] }
                        }
                    }
                }
            },
            {
                $addFields: {
                    "unSeenCount": { $size: "$chatInfo" }
                }
            },
            { $unset: "chatInfo" }
        ]
        chatInfo = await db.getAggregation("connection", aggregationQuery)

        return ctx.response.body = { status: 1, data: JSON.stringify(chatInfo) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in chat controllers/getAllChatInfo - ${error.message}` }
    }
}

const updateChatStatus = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let chatData = ctx.request.body, chatInfo, updateInfo;
        if (Object.keys(chatData).length === 0 && chatData.data === undefined) {
            ctx.response.body = data

            return
        }
        chatData = chatData.data[0]
        chatInfo = await db.findAndSelect("chat", { connectionId: chatData.connectionId, status: 0, sender: { $ne: new ObjectId(chatData.userId) } }, { _id: 1 })
        if (chatInfo.length === 0) {

            return ctx.response.body = { status: 0, response: "No unseen chat found" }
        }
        updateInfo = await db.updateManyDocuments("chat", { _id: chatInfo }, { status: 1 })
        if (updateInfo.modifiedCount !== 0 && updateInfo.matchedCount !== 0) {

            return ctx.response.body = { status: 1, response: "Messages acknowledged" }
        }
        return ctx.response.body = data
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in updateChatStatus controllers/getAllChatInfo - ${error.message}` }
    }
}

const getChatsByConnectionId = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let chatData = ctx.request.body, chatInfo, aggregationQuery = [];
        if (Object.keys(chatData).length === 0 && chatData.data === undefined) {
            ctx.response.body = data

            return
        }
        chatData = chatData.data[0]
        aggregationQuery = [
            {
                $match: { connectionId: new ObjectId(chatData.connectionId) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "sender",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            {
                $addFields: {
                    "fullName": "$userInfo.fullName",
                    "profile": "$userInfo.profile"
                }
            },
            {
                $project: {
                    "_id": 0,
                    "senderId": "$sender",
                    "message": "$message",
                    "fullName": { "$arrayElemAt": ["$fullName", 0] },
                    "profile": { "$arrayElemAt": ["$profile", 0] },
                    "status": "$status",
                    "createdAt": "$createdAt"
                }
            }
        ]
        chatInfo = await db.getAggregation("chat", aggregationQuery)

        return ctx.response.body = { status: 1, data: JSON.stringify(chatInfo) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in updateChatStatus controllers/getChatsByConnectionId - ${error.message}` }
    }
}


module.exports = { getAllChatInfo, updateChatStatus, getChatsByConnectionId }