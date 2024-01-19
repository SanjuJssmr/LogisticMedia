const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const chatSchema = mongoose.Schema({
    connectionId: {
        type: ObjectId,
        ref: "connection",
        required: true
    },
    sender: {
        type: ObjectId,
        ref: "user",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("chat", chatSchema)