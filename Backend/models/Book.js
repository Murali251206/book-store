const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: "General" },
  image: { type: String, default: "" },
  description: { type: String, default: "" },
  availability: { type: Boolean, default: true },
  stock: { type: Number, default: 10 },
  ratings: { type: Number, default: 0 },
  reviews: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      rating: Number,
      comment: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Book", bookSchema);
