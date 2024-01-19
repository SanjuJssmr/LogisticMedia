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
    phNumber: {
        type: String
    },
    profile: {
        type: String,
        default: "https://t4.ftcdn.net/jpg/03/59/58/91/360_F_359589186_JDLl8dIWoBNf1iqEkHxhUeeOulx0wOC5.jpg"
    },
    otp: {
        type: String,
        require:true
    },
    state: {
        type: String,
        require:true
    },
    country: {
        type: String,
        require: true
    },
    dob: {
        type: Date,
        require:true
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
        default: 2
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model("user", userSchema)