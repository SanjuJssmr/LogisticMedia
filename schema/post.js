const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const postSchema = mongoose.Schema({
    createdBy: {
        type: ObjectId,
        required: true,
        ref: "user"
    },
    description: {
        type: String
    },
    hashtags: {
        type: Array
    },
    state: {
        type: String
    },
    country: {
        type: String
    },
    files: {
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
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("post", postSchema)