const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const questionLikeSchema = mongoose.Schema({
    questionId: {
        type: ObjectId,
        ref: "question",
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

module.exports = mongoose.model("questionLike", questionLikeSchema)