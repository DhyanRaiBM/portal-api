import { Router } from "express";
import { deleteUser, googleSignIn, refreshAccessToken, signIn, signOutUser, signUp, updateUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/google", googleSignIn);
router.post("/refresh-access-token", refreshAccessToken);

//~Secure routes :
router.patch("/update", verifyJWT, updateUser);
router.post("/delete", verifyJWT, deleteUser);
router.post("/signout", verifyJWT, signOutUser);


export default router;