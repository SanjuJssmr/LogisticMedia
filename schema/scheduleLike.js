const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const scheduleLikeSchema = mongoose.Schema({
    scheduleId: {
        type: ObjectId,
        ref: "schedule",
        required: true
    },
    likes: {
        type: Number
    },
    likedBy: {
        type: Array,
        default: []
    },
    status: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("scheduleLike", scheduleLikeSchema)