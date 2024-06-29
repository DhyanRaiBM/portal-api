// src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use(express.json({ limit: "16kb" })); // Json data limit
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // Accept form or any urlencoded data from request body and add it as req.body
app.use(express.static("public"));
app.use(cookieParser());

//=Import Routes :
import userRouter from './routes/user.route.js';
import listingRouter from './routes/listing.route.js';

//=Routes declaration :
app.use("/api/users", userRouter);
app.use("/api/listings", listingRouter);

//=Error Middleware :
import { errorMiddleware } from "./middlewares/error.middleware.js";
app.use(errorMiddleware);

// Create a new router for the root route
app.post("/", (req, res) => {
    res.send(`App is running..${req.body.name}`);
});

// Export app and handler
export default app;
