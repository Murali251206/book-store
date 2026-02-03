const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/Order");
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

router.post("/create-payment-intent", auth, async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: "Invalid amount" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), 
      currency: "inr",
      metadata: { orderId: orderId || "unknown" }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post("/confirm-payment", auth, async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentId = paymentIntentId;
          order.status = "Processing";
          await order.save();
        }
      }

      res.json({
        success: true,
        msg: "Payment successful",
        paymentIntentId: paymentIntentId
      });
    } else {
      res.status(400).json({
        success: false,
        msg: "Payment not completed"
      });
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
