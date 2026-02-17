import React, { useState, useEffect, useContext } from "react"
import { CartContext } from "../context/CartContext"
import "../styles/Home.css"

function Home({ setPage, setBuyItem }) {
  const { addToCart } = useContext(CartContext)
  const [books, setBooks] = useState([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [visibleCount, setVisibleCount] = useState(9)

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        let url = "https://book-store-backend-rg5z.onrender.com/api/books?"
        const params = new URLSearchParams()

        if (search) params.append("search", search)
        if (category && category !== "all") params.append("category", category)
        if (minPrice) params.append("minPrice", minPrice)
        if (maxPrice) params.append("maxPrice", maxPrice)

        url += params.toString()

        const res = await fetch(url)
        const data = await res.json()
        setBooks(data)

        if (!categories.length && data.length > 0) {
          const uniqueCategories = [...new Set(data.map(b => b.category))]
          setCategories(uniqueCategories)
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching books:", err)
        setLoading(false)
      }
    }

    fetchBooks()
    setVisibleCount(9)
  }, [search, category, minPrice, maxPrice, categories.length])

  const buyNow = (book) => {
    setBuyItem({ items: [{ ...book, quantity: 1 }] })
    setPage("address")
  }

  if (loading) {
    return <div className="loading-container">Loading books...</div>
  }

  return (
    <div className="home-container">
      <div className="filter-section">
        <h3>Filters</h3>

        <div className="filter-group">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            className="search"
            placeholder="Search by title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="minPrice">Min Price</label>
          <input
            id="minPrice"
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="price-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="maxPrice">Max Price</label>
          <input
            id="maxPrice"
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="price-input"
          />
        </div>

        <button
          onClick={() => {
            setSearch("")
            setCategory("all")
            setMinPrice("")
            setMaxPrice("")
          }}
          className="btn-secondary"
        >
          Clear Filters
        </button>
      </div>

      <div className="books-section">
        {books.length === 0 ? (
          <p className="unavailable-message">No books found. Try adjusting your filters.</p>
        ) : (
          <>
            <div className="book-grid">
              {books.slice(0, visibleCount).map((book) => (
                <div key={book._id} className="book-card">
                  <div className="book-image-container">
                    {book.image ? (
                      <img
                        src={book.image}
                        alt={book.title}
                        className="book-image"
                        onError={(e) => e.target.src = "https://via.placeholder.com/150x220?text=No+Image"}
                      />
                    ) : (
                      <div className="book-image-placeholder">No Image</div>
                    )}
                  </div>
                  <div className="book-info">
                    <h3>{book.title}</h3>
                    <p className="author">by {book.author}</p>
                    {book.category && <p className="category">{book.category}</p>}
                    <div className="availability">
                      {(book.stock || 0) > 0 ? (
                        <span className="in-stock">In Stock</span>
                      ) : (
                        <span className="out-of-stock">Out of Stock</span>
                      )}
                    </div>
                  </div>

                  <div className="book-footer">
                    <p className="price">₹{book.price}</p>

                    <div className="btn-group">
                      <button
                        onClick={() => addToCart(book)}
                        className="btn-add-cart"
                        disabled={(book.stock || 0) === 0}
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => buyNow(book)}
                        className="btn-buy-now"
                        disabled={(book.stock || 0) === 0}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {visibleCount < books.length && (
              <div className="view-all-container">
                <button
                  onClick={() => setVisibleCount(prev => prev + 9)}
                  className="btn-view-all"
                >
                  View More Books
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Home
