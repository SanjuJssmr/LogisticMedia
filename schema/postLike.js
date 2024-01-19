const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const postLikeSchema = mongoose.Schema({
    postId: {
        type: ObjectId,
        ref: "post",
        required: true
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

module.exports = mongoose.model("postLike", postLikeSchema)