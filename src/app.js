// src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";
import serverless from 'serverless-http';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN
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
app.get("/", (req, res) => {
    res.send("App is running..");
});

// Export app and handler
export const handler = serverless(app);
export default app;
