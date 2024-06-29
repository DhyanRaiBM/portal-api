import express from 'express';
import { createListing, deleteListing, getListing, getListings, getUserListing, updateListing } from '../controllers/listing.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/create', verifyJWT, createListing);
router.get('/get-listings', verifyJWT, getUserListing);
router.delete('/delete/:id', verifyJWT, deleteListing);
router.patch('/update/:id', verifyJWT, updateListing);

//~No middleware applied here
router.get('/get-listing/:id', getListing);
router.get('/get', getListings);


export default router;