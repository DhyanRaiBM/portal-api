import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import generatePassword from "generate-password";

//=Generate tokens :
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

//=Sign Up :
export const signUp = asyncHandler(async (req, res, next) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        throw new ApiError(400, "All fields are required!!")
    }

    console.log(username, email, password);

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) throw new ApiError(400, "User already exists");

    const newUser = await User.create({
        username,
        email,
        password
    })

    if (!newUser) {
        throw new ApiError(500, "Failed to create user!")
    }

    res
        .status(201)
        .json(
            new ApiResponse(201, 'User created successfully!', newUser)
        )

})

//=Sign In :
export const signIn = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;


    if (!email || !password) {
        throw new ApiError(400, "Enter all fields");
    }

    const user = await User.findOne({
        email
    })

    if (!user) throw new ApiError(400, "User not found");


    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) throw new ApiError(401, "Invalid password");


    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const cookieOptions = {
        secure: true, // Only transmit cookie over HTTPS
        httpOnly: true, // Cookie is not accessible via client-side scripts
        sameSite: 'Strict', // Restrict cookie to same site requests
        // maxAge: 3600000, // Expiry time in milliseconds (e.g., 1 hour)
    };

    res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(200, "Logged in successfully", {
                loggedInUser,
            })
        )
})

//=Google Sign In :
export const googleSignIn = asyncHandler(async (req, res) => {
    const { username, avatar, email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required")
    }

    const user = await User.findOne({
        email
    })


    const cookieOptions = {
        secure: true, // Only transmit cookie over HTTPS
        httpOnly: true, // Cookie is not accessible via client-side scripts
        sameSite: 'Strict', // Restrict cookie to same site requests
        // maxAge: 3600000, // Expiry time in milliseconds (e.g., 1 hour)
    };

    if (user) {
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        const loggedInUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
        res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(
                new ApiResponse(200, "Logged in successfully", {
                    loggedInUser,
                })
            )
    } else {
        const user = await User.create({
            username: username ?
                username.split(" ").join("") : email.slice(0, 4) + Math.floor(Math.random() * 10000),
            email,
            avatar: avatar || "https://cdn-icons-png.flaticon.com/512/6596/6596121.png",
            password: generatePassword.generate()
        })

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        const loggedInUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
        res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(
                new ApiResponse(200, "Logged in successfully", {
                    loggedInUser,
                })
            )
    }

})

//=Update User :
export const updateUser = asyncHandler(async (req, res) => {

    const { username, password, email, avatar } = req.body;

    if (!username) {
        throw new ApiError(400, "Username cannot be empty!!")
    }
    if (!email) {
        throw new ApiError(400, "Email cannot be empty!!")
    }
    if (!password) {
        throw new ApiError(400, "Password cannot be empty!!")
    }

    const user = await User.findOne({ _id: req.user._id });

    if (!user) {
        throw new ApiError(400, "User not found!!")
    }

    Object.assign(user, { password, email, username });
    if (avatar) {
        signOutUser.avatar = avatar;
    }
    await user.save();

    const updatedUser = await User.findOne({ _id: req.user._id }).select("-password,refresh");

    if (!updatedUser) {
        throw new ApiError(500, "Failed to update user")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "User details updated successfully", updatedUser))
});


//=Logout controller :
export const signOutUser = asyncHandler(async (req, res, next) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { "refreshToken": "" }
        }
    )

    const cookieOptions = {
        secure: true, // Only transmit cookie over HTTPS
        httpOnly: true, // Cookie is not accessible via client-side scripts
        sameSite: 'Strict', // Restrict cookie to same site requests
        maxAge: 3600000, // Expiry time in milliseconds (e.g., 1 hour)
    };

    res
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json(
            new ApiResponse(200, "Logged out successfully")
        )

})

//=Delete User :
export const deleteUser = asyncHandler(async (req, res) => {
    const deleteOperation = await User.findByIdAndDelete(req.user._id);

    if (!deleteOperation) {
        throw new ApiError(404, "User not found");
    }

    res
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json(
            new ApiResponse(200, "Account Deleted Successfully")
        )

})

//=Refresh Access Token :
export const refreshAccessToken = asyncHandler(async (req, res) => {

    //Get the refresh token
    //verify the refresh token and get the user
    //check if the refresh token is equal to the refresh token in DB
    //if yes refresh the access token and refresh token 

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Session Expired,Please Login again")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Session Expired,Please Login again")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Session Expired,Please Login again")

        }

        const cookieOptions = {
            secure: true, // Only transmit cookie over HTTPS
            httpOnly: true, // Cookie is not accessible via client-side scripts
            sameSite: 'Strict', // Restrict cookie to same site requests
            maxAge: 3600000, // Expiry time in milliseconds (e.g., 1 hour)
        };
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: refreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Session Expired,Please Login again")
    }

})

