import { Response, NextFunction } from "express";
import User from "../../models/User";
import { AuthenticatedRequest } from "../../types";
import { createError } from "../../middlewares/error.middleware";

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return next(createError("User not found", 404));
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { name },
      { new: true, runValidators: true }
    );
    if (!user) return next(createError("User not found", 404));
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?.id).select("+password");
    if (!user) return next(createError("User not found", 404));

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return next(createError("Current password is incorrect", 400));

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};
