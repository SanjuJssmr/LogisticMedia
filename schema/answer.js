const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const answerSchema = mongoose.Schema({
    questionId: {
        type: ObjectId,
        ref: "QnA",
        required: true
    },  
    userId: {
        type: ObjectId,
        ref: "user",
        required: true
    },
    answer: {
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
    answeredOn: {
        type: Date,
        default: Date.now()
    },
    status: {
        type: Number,
        default: 1
    },
    likes: {
        type: Number
    },
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("answer", answerSchema)