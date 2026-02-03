const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ msg: "Username, email, and password are required" });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role === "admin" ? "admin" : "user"
    });
    await newUser.save();

    res.status(201).json({ msg: "User registered successfully", userId: newUser._id });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) {
      return res.status(400).json({ msg: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      username: user.username,
      email: user.email,
      role: user.role,
      userId: user._id
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/profile", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    User.findById(decoded.id).select("-password").then(user => {
      res.json(user);
    });
  } catch {
    res.status(401).json({ msg: "Token is not valid" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    if (!email || !newPassword) {
      return res.status(400).json({ msg: "Email and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "User with this email does not exist" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters long" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ msg: "Password reset successfully. Please login with your new password." });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

// Get all addresses for the logged-in user
router.get("/addresses", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user.addresses || []);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Save a new address for the user
router.post("/addresses", verifyToken, async (req, res) => {
  const { name, mobile, email, address, city, state, district } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const newAddress = {
      id: Date.now().toString(),
      name,
      mobile,
      email,
      address,
      city,
      state,
      district
    };

    if (!user.addresses) user.addresses = [];
    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json(newAddress);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Update an address for the user
router.put("/addresses/:addressId", verifyToken, async (req, res) => {
  const { addressId } = req.params;
  const { name, mobile, email, address, city, state, district } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const addressIndex = user.addresses.findIndex(addr => addr.id === addressId);
    if (addressIndex === -1) return res.status(404).json({ msg: "Address not found" });

    user.addresses[addressIndex] = {
      id: addressId,
      name,
      mobile,
      email,
      address,
      city,
      state,
      district
    };

    await user.save();
    res.json(user.addresses[addressIndex]);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Delete an address for the user
router.delete("/addresses/:addressId", verifyToken, async (req, res) => {
  const { addressId } = req.params;
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.addresses = user.addresses.filter(addr => addr.id !== addressId);
    await user.save();

    res.json({ msg: "Address deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
