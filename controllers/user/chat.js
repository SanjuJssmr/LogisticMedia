const mongoose = require("mongoose");
const db = require("../../model/mongodb")
const ObjectId = mongoose.Types.ObjectId

const getAllChatInfo = async (ctx) => {
    let data = { status: 0, response: "Invalid request" }
    try {
        let connectionData = ctx.request.body, chatInfo, aggregationQuery = [];
        if (Object.keys(connectionData).length === 0 && connectionData.data === undefined) {
            res.send(data)

            return
        }
        connectionData = connectionData.data[0]
        aggregationQuery = [
            {
                $match: {
                    $or: [
                        { status: 1 }
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
                    "recipientName": "$recipientInfo.fullName"
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
                $project: {
                    "_id": "$_id",
                    "senderId": "$senderId",
                    "senderName": { '$arrayElemAt': ['$senderName', 0] },
                    "recipientName": { '$arrayElemAt': ['$recipientName', 0] },
                    "recipientId": "$recipientId",
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
                    "unSeenCount": { $size: "$chatInfo" },
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
            res.send(data)

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
        let chatData = ctx.request.body, chatInfo;
        if (Object.keys(chatData).length === 0 && chatData.data === undefined) {
            res.send(data)

            return
        }
        chatData = chatData.data[0]
        chatInfo = await db.findAndSelect("chat", { connectionId: chatData.connectionId }, { _id: 0, sender: 1, message: 1 })

        return ctx.response.body = { status: 1, data: JSON.stringify(chatInfo) }
    } catch (error) {
        console.log(error)
        return ctx.response.body = { status: 0, response: `Error in updateChatStatus controllers/getChatsByConnectionId - ${error.message}` }
    }
}


module.exports = { getAllChatInfo, updateChatStatus, getChatsByConnectionId }