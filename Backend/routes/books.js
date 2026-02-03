const express = require("express");
const router = express.Router();
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

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.role !== "admin") {
      return res.status(403).json({ msg: "Admin access required" });
    }
    next();
  });
};

router.get("/", async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;
    let filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } }
      ];
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const books = await Book.find(filter);
    res.json(books);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ msg: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post("/", adminAuth, async (req, res) => {
  try {
    const { title, author, price, description, category, stock, image } = req.body;
    
    if (!title || !author || !price) {
      return res.status(400).json({ msg: "Title, author, and price are required" });
    }

    const newBook = new Book({
      title,
      author,
      price,
      description: description || "",
      category: category || "General",
      image: image || "",
      stock: stock || 10,
      availability: true
    });

    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/:id", adminAuth, async (req, res) => {
  try {
    const { title, author, price, description, category, stock, availability, image } = req.body;

    let book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ msg: "Book not found" });

    if (title) book.title = title;
    if (author) book.author = author;
    if (price) book.price = price;
    if (description) book.description = description;
    if (category) book.category = category;
    if (image !== undefined) book.image = image;
    if (stock !== undefined) book.stock = stock;
    if (availability !== undefined) book.availability = availability;
    book.updatedAt = Date.now();

    await book.save();
    res.json(book);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ msg: "Book not found" });
    res.json({ msg: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
