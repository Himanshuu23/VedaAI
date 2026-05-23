import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../../models/User";
import { createError } from "../../middlewares/error.middleware";

const signToken = (id: string, email: string, role: string): string =>
  jwt.sign({ id, email, role }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return next(createError("Email already registered", 409));
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user.id as string, user.email, user.role);

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return next(createError("Invalid email or password", 401));
    }

    const token = signToken(user.id as string, user.email, user.role);

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
  req: Request & { user?: { id: string } },
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
