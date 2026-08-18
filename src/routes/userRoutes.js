import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import protectedAdminRoute from "../middleware/auth.admin.middleware.js";
import protectedUserRoute from "../middleware/auth.user.middleware.js";

const router = express.Router();

router.get("/", protectedAdminRoute, async (req, res) => {
  try {
    res.json(await User.findNonAdmins());
  } catch (error) {
    res.status(500).json({ message: "Users could not be fetched." });
  }
});

router.get("/addresses", protectedUserRoute, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user?.shippingAddresses || []);
});

router.post("/addresses", protectedUserRoute, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });
  const addresses = [
    ...(user.shippingAddresses || []),
    { _id: crypto.randomUUID(), ...req.body },
  ];
  if (addresses.length > 3)
    return res
      .status(400)
      .json({ message: "Maximum 3 addresses can be added." });
  await User.update(user._id, { shippingAddresses: addresses });
  res.status(201).json({ message: "The address added successfully." });
});

router.put("/addresses/:id", protectedUserRoute, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });
  const addresses = (user.shippingAddresses || []).map((address) =>
    address._id === req.params.id ? { ...address, ...req.body } : address,
  );
  if (!addresses.some((address) => address._id === req.params.id))
    return res.status(404).json({ message: "Address not found" });
  await User.update(user._id, { shippingAddresses: addresses });
  res.json({ success: true, message: "Address updated", addresses });
});

router.delete("/addresses/:id", protectedUserRoute, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });
  const addresses = (user.shippingAddresses || []).filter(
    (address) => address._id !== req.params.id,
  );
  await User.update(user._id, { shippingAddresses: addresses });
  res.json(addresses);
});

router.get("/:userId", protectedUserRoute, async (req, res) => {
  if (req.user._id !== req.params.userId)
    return res.status(403).json({ message: "Access denied" });
  const user = User.withoutPassword(await User.findById(req.params.userId));
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({
    user: {
      id: user._id,
      firstname_lastname: user.firstname_lastname,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role,
      shippingAddresses: user.shippingAddresses,
    },
  });
});

export default router;
