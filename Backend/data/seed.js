const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Book = require("../models/Book");
const booksData = require("./booksData");

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await Book.deleteMany({});
    await Book.insertMany(booksData);
    console.log("Books seeded");
    process.exit();
  })
  .catch(err => console.log(err));
