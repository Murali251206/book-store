const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
      title: String,
      author: String,
      price: Number,
      quantity: { type: Number, default: 1 }
    }
  ],
  addressDetails: {
    name: String,
    mobile: String,
    email: String,
    address: String,
    city: String,
    state: String,
    district: String
  },
  paymentMethod: { type: String, enum: ["Card", "UPI", "Cash", "Online"], default: "Online" },
  paymentId: String,
  status: { type: String, enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]},
  returnStatus: { type: String, enum: ["None", "Requested", "Approved", "Rejected", "Returned", "Refunded"], default: "None" },
  returnReason: String,
  returnRequestDate: Date,
  totalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
