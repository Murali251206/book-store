const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Book = require("../models/Book");
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.role = decoded.role;
    next();
  } catch {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

router.post("/", auth, async (req, res) => {
  const { items, addressDetails, paymentMethod } = req.body;
  try {
    if (!items || items.length === 0) {
      return res.status(400).json({ msg: "Items are required" });
    }

    if (!addressDetails) {
      return res.status(400).json({ msg: "Address details are required" });
    }

    // Check stock availability for all items
    for (const item of items) {
      const book = await Book.findById(item.bookId);
      if (!book) {
        return res.status(404).json({ msg: `Book with id ${item.bookId} not found` });
      }
      if (book.stock < item.quantity) {
        return res.status(400).json({ msg: `Insufficient stock for ${book.title}. Available: ${book.stock}, Requested: ${item.quantity}` });
      }
    }

    // Decrease stock for all books
    for (const item of items) {
      await Book.findByIdAndUpdate(
        item.bookId,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    const newOrder = new Order({
      userId: req.userId,
      items,
      addressDetails,
      paymentMethod: paymentMethod || "Online",
      totalAmount,
      status: "Pending"
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/user/myorders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("userId");
    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (order.userId._id.toString() !== req.userId && req.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/admin/all", auth, async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ msg: "Admin access required" });
    }

    const orders = await Order.find({})
      .populate("userId", "username email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// User cancel order (only if Pending)
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: "Order not found" });

    // Check if user owns this order
    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({ msg: "You can only cancel your own orders" });
    }

    // Can only cancel pending orders
    if (order.status !== "Pending") {
      return res.status(400).json({ msg: `Cannot cancel ${order.status} order` });
    }

    // Restore stock for all items in the order
    for (const item of order.items) {
      await Book.findByIdAndUpdate(
        item.bookId,
        { $inc: { stock: item.quantity } },
        { new: true }
      );
    }

    order.status = "Cancelled";
    order.updatedAt = Date.now();
    await order.save();

    res.json({ msg: "Order cancelled successfully", order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Admin update order status
router.put("/:id", auth, async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ msg: "Admin access required" });
    }

    const { status } = req.body;
    const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: "Order not found" });

    order.status = status;
    order.updatedAt = Date.now();
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ msg: "Admin access required" });
    }

    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ msg: "Order not found" });

    res.json({ msg: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// User request return
router.put("/:id/return-request", auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) return res.status(404).json({ msg: "Order not found" });
    
    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({ msg: "You can only return your own orders" });
    }
    
    if (order.status !== "Delivered") {
      return res.status(400).json({ msg: "Only delivered orders can be returned" });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ msg: "Return reason is required" });
    }

    order.returnStatus = "Requested";
    order.returnReason = reason;
    order.returnRequestDate = Date.now();
    order.updatedAt = Date.now();
    await order.save();

    res.json({ msg: "Return request submitted successfully", order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Admin approve/reject return
router.put("/:id/return/:action", auth, async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(403).json({ msg: "Admin access required" });
    }

    const { action } = req.params;
    const validActions = ["approve", "reject"];

    if (!validActions.includes(action)) {
      return res.status(400).json({ msg: "Invalid action" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (order.returnStatus !== "Requested") {
      return res.status(400).json({ msg: "No pending return request" });
    }

    if (action === "approve") {
      order.returnStatus = "Approved";
    } else if (action === "reject") {
      order.returnStatus = "Rejected";
    }

    order.updatedAt = Date.now();
    await order.save();

    res.json({ msg: `Return request ${action}ed successfully`, order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Update return status (user submits return shipment)
router.put("/:id/return-complete", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) return res.status(404).json({ msg: "Order not found" });
    
    if (order.userId.toString() !== req.userId) {
      return res.status(403).json({ msg: "Access denied" });
    }

    if (order.returnStatus !== "Approved") {
      return res.status(400).json({ msg: "Return not approved" });
    }

    order.returnStatus = "Returned";
    order.updatedAt = Date.now();
    await order.save();

    res.json({ msg: "Return marked as complete. Refund will be processed soon.", order });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
