const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const followerSchema = mongoose.Schema({
    followerId: {
        type: ObjectId,
        required: true,
        ref : "user"
    },
    companyId: {
        type: ObjectId,
        required: true,
        ref :"companyPage"
    },
    status: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("follower", followerSchema)