import React, { useState } from "react"
import { AuthProvider, AuthContext } from "./context/AuthContext"
import { CartProvider, CartContext } from "./context/CartContext"
import Home from "./pages/Home"
import Cart from "./pages/Cart"
import Orders from "./pages/Orders"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Address from "./pages/Address"
import Payment from "./pages/Payment"
import Admin from "./pages/Admin"
import "./App.css"

function AppContent() {
  const { user, logout } = React.useContext(AuthContext)
  const { cart } = React.useContext(CartContext)
  const [page, setPage] = useState("home")
  const [buyItem, setBuyItem] = useState(null)

  const handleLogout = () => {
    logout()
    setPage("home")
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="navbar-brand">Book Store</h1>

          <div className="nav-links">
            <button
              onClick={() => setPage("home")}
              className={`nav-btn ${page === "home" ? "active" : ""}`}
            >
              Home
            </button>
            <button
              onClick={() => setPage("cart")}
              className={`nav-btn ${page === "cart" ? "active" : ""}`}
            >
              Cart
              {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
            </button>
            <button
              onClick={() => setPage("orders")}
              className={`nav-btn ${page === "orders" ? "active" : ""}`}
            >
              My Orders
            </button>

            {user && user.role === "admin" && (
              <button
                onClick={() => setPage("admin")}
                className={`nav-btn ${page === "admin" ? "active" : ""}`}
              >
                Admin Panel
              </button>
            )}

            <div className="navbar-divider"></div>

            {user ? (
              <div className="user-section">
                <span className="user-name">👤 {user.username}</span>
                <button onClick={handleLogout} className="nav-btn btn-logout">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setPage("login")}
                  className={`nav-btn ${page === "login" ? "active" : ""}`}
                >
                  Login
                </button>
                <button
                  onClick={() => setPage("register")}
                  className={`nav-btn ${page === "register" ? "active" : ""}`}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {page === "home" && <Home setPage={setPage} setBuyItem={setBuyItem} />}
        {page === "cart" && <Cart setPage={setPage} setBuyItem={setBuyItem} />}
        {page === "address" && (
          <Address buyItem={buyItem} setBuyItem={setBuyItem} setPage={setPage} />
        )}
        {page === "payment" && (
          <Payment buyItem={buyItem} setOrders={() => {}} setPage={setPage} />
        )}
        {page === "orders" && <Orders />}
        {page === "admin" && <Admin />}
        {page === "login" && <Login setPage={setPage} />}
        {page === "register" && <Register setPage={setPage} />}
      </main>

      <footer className="footer">
        <p>&copy; 2026 Online Book Store. All rights reserved.</p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  )
}

export default App
