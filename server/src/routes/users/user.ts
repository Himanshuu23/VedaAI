import { Router } from "express";
import { z } from "zod";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../../controllers/users/user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

router.use(authenticate);

router.get("/profile", getProfile);

router.patch(
  "/profile",
  validate(z.object({ name: z.string().min(2).max(100) })),
  updateProfile
);

router.patch(
  "/change-password",
  validate(
    z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    })
  ),
  changePassword
);

export default router;
