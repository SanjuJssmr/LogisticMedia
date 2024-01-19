const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const scheduleSchema = mongoose.Schema({
    createBy: {
        type: ObjectId,
        ref: "page",
        required: true
    },
    companyId: {
        type: ObjectId,
        ref: "page",
        required: true
    },
    pol: {
        type: String,
        required : true
    },
    pod: {
        type: String,
        required : true
    },
    openingOn: {
        type: Date,
        required : true
    },
    bookingCutOff: {
        type: Date,
        required : true
    },
    description: {
        type: String
    },
    status: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("schedule", scheduleSchema)