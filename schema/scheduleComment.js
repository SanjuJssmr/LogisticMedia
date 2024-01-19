const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const scheduleCommentSchema = mongoose.Schema({
    scheduleId: {
        type: ObjectId,
        ref: "schedule",
        required: true
    },
    userCommented: {
        type: ObjectId,
        ref: "user",
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    replies: [
        {
            userReplied: {
                type: ObjectId,
                ref: "user"
            },
            reply: {
                type: String
            },
            replyStatus: {
                type: Number,
                default: 1
            },
            repliedOn: {
                type: Date,
                default: Date.now()
            }
        },
    ],
    commentedOn: {
        type: Date,
        default: Date.now()
    },
    status: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("scheduleComment", scheduleCommentSchema)