const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    fullname: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        lowercase: true
    },
    designation: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    profile: {
        type: String,
        default: "https://t4.ftcdn.net/jpg/03/59/58/91/360_F_359589186_JDLl8dIWoBNf1iqEkHxhUeeOulx0wOC5.jpg"
    },
    otp: {
        type: String
    },
    state: {
        type: String
    },
    country: {
        type: String
    },
    dob: {
        type: Date
    },
    about: {
        type: String
    },
    role: {
        type: Number,
        default: 1
    },
    status: {
        type: Number,
        status: 1
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("user", userSchema)