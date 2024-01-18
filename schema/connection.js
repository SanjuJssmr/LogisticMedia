const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const connectionSchema = mongoose.Schema({
    senderId: {
        type: ObjectId,
        ref :"user",
        required : true
    },
    recipientId: {
        type: ObjectId,
        ref :"user",
        required : true
    },
    status: {
        type: Number,
        default: 2
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("connection", connectionSchema)