const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const notificationSchema = mongoose.Schema({
    receiverId: {
        type: ObjectId,
        ref: "user",
        required: true
    }, 
    senderId: {
        type: ObjectId,
        ref: "user",
        required: true
    },
    postId: {
        type: ObjectId,
        ref: "post",
        required: true
    },
    commentId: {
        type: ObjectId
    },
    status: {
        type: Number,
        default: 0
    },  
    category: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("notification", notificationSchema)