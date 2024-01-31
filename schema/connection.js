const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const connectionSchema = mongoose.Schema({
    senderId: {
        type: ObjectId,
        ref: "user",
        required: true
    },
    recipientId: {
        type: ObjectId,
        ref: "user",
        required: true
    },
    status: {
        type: Number,      // 2- friend req send, 1- conncted
        default: 2
    },
    connected: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("connection", connectionSchema)