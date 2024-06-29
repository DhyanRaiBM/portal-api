import mongoose from "mongoose";
import Listing from "../models/listing.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//=Create listing:
export const createListing = asyncHandler(async (req, res, next) => {

    const listing = await Listing.create({
        ...req.body,
        user: req.user._id
    })

    if (!listing) {
        throw new ApiError("Failed to create listing!");
    }

    res
        .status(201)
        .json(
            new ApiResponse(201, "Listing created successfully", listing)
        )
})

//=Get user listing:
export const getUserListing = asyncHandler(async (req, res) => {
    const listings = await Listing.find({ user: req.user._id });

    if (!listings) {
        throw new ApiError("Listings not found");
    }

    res
        .status(200)
        .json(
            new ApiResponse(200, "Listing fetched successfully", listings)
        )
})

//=Get listing by id:
export const getListing = asyncHandler(async (req, res) => {
    console.log(req.params);

    if (!req.params.id) {
        throw new ApiError(400, "Invalid id")
    }
    const listing = await Listing.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.params.id)
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            email: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                user: {
                    $first: "$user"
                }
            }
        }
    ]);

    if (!listing) {
        throw new ApiError("Listing not found");
    }

    res
        .status(200)
        .json(
            new ApiResponse(200, "Listing fetched successfully", listing[0])
        )
})

//=Delete listing:
export const deleteListing = asyncHandler(async (req, res, next) => {

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        throw new ApiError("Listing not found");
    }
    const dlisting = await Listing.findByIdAndDelete(req.params.id);
    if (!dlisting) {
        throw new ApiError("Failed to delete listing");
    }
    res.status(200).json(
        new ApiResponse(200, {}, "Listing deleted successfully")
    );

})

//=Update Listing:
export const updateListing = asyncHandler(async (req, res, next) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        throw new ApiError("Listing not found");
    }

    const updatedListing = await Listing.findByIdAndUpdate(req.params.id, {
        ...req.body,
        user: req.user._id
    }, { new: true });

    if (!updatedListing) {
        throw new ApiError("Failed to update listing");
    }
    res.status(200).json(
        new ApiResponse(200, "Listing updated successfully", updatedListing)
    );

})

//=Get Listings:
export const getListings = asyncHandler(async (req, res, next) => {

    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;
    let offer = req.query.offer;

    if (offer === undefined || offer === 'false') {
        offer = { $in: [false, true] };
    }
    let furnished = req.query.furnished;

    if (furnished === undefined || furnished === 'false') {
        furnished = { $in: [false, true] };
    }

    let parking = req.query.parking;

    if (parking === undefined || parking === 'false') {
        parking = { $in: [false, true] };
    }

    let type = req.query.type;

    if (type === undefined || type === 'all') {
        type = { $in: ['sale', 'rent'] };
    }

    const searchTerm = req.query.searchTerm || '';

    const sort = req.query.sort || 'createdAt';

    const order = req.query.order || 'desc';

    const listings = await Listing.find({
        name: { $regex: searchTerm, $options: 'i' },
        offer,
        furnished,
        parking,
        type,
    })
        .sort({ [sort]: order })
        .limit(limit)
        .skip(startIndex);

    if (!listings) {
        throw new ApiError(400, "No listings found!")
    }

    res
        .status(200)
        .json(
            new ApiResponse(200, "Listings fethed successfully", listings)
        )

})