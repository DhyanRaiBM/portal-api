import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    refreshToken: {
        type: String
    },
    avatar: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/6596/6596121.png"
    }
}, { timestamps: true });


userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next();//- the next middleware in the sequence (or the actual save operation) should proceed.
})

userSchema.methods.isPasswordCorrect = async function (password) {
    //-This is used to add instance methods to the documents constructed from the schema. Instance methods are methods that you can call on individual document instances (i.e., user instances) created from the schema.
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },//-Payload
        process.env.ACCESS_TOKEN_SECRET,//-Secret
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }//-Expiry
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,

        },//-Payload
        process.env.REFRESH_TOKEN_SECRET,//-Secret
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }//-Expiry
    )
}

export const User = mongoose.model('User', userSchema);
