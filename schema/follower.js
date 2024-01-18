const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const followerSchema = mongoose.Schema({
    followers: {
        type: ObjectId
    },
    pageId: {
        type: ObjectId
    },
    status: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("followers", followerSchema)