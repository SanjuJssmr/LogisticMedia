const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const questionAndQuestion = mongoose.Schema({
    createdBy: {
        type: ObjectId,
        required: true,
        ref: "user"
    },
    question: {
        type: String,
        required: true
    },
    hashtags: {
        type: Array
    },
    location: {
        type: String
    },
    filePath: {
        type: Array
    },
    status: {
        type: Number,
        default: 1
    },
    reportCount: [{
        userId: {
            type: ObjectId
        },
        reason: {
            type: String
        },
        reportedOn: {
            type: String
        }
    }],
    likes: {
        type: Number
    },
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("QnA", questionAndQuestion)