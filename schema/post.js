const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const postSchema = mongoose.Schema({
    createdBy: {
        type: ObjectId,
        required: true,
        ref: "user"
    },
    companyId: {
        type: ObjectId,
        ref: "companyPage"
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
        type: Number,   // 0 for delete, 1 for active, 2 for company blocked
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
            type: Date,
            default : Date.now()
        }
    }],
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("post", postSchema)