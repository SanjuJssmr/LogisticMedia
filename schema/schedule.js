const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const scheduleSchema = mongoose.Schema({
    createdBy: {
        type: ObjectId,
        ref: "user",
    },
    companyId: {
        type: ObjectId,
        ref: "companyPage",

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