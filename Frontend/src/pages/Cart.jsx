import React, { useContext } from "react"
import { CartContext } from "../context/CartContext"
import "../styles/Cart.css"

function Cart({ setPage, setBuyItem }) {
  const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useContext(CartContext)

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Your cart is empty!")
      return
    }
    setBuyItem({ items: cart })
    setPage("address")
  }

  if (cart.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <h2>Your Cart is Empty</h2>
          <p>Start adding books to your cart!</p>
          <button onClick={() => setPage("home")} className="btn-primary">
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-container">
      <h2>Shopping Cart</h2>

      <div className="cart-content">
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item._id} className="cart-item">
              <div className="item-details">
                <h4>{item.title}</h4>
                <p className="item-author">by {item.author}</p>
                <p className="item-price">₹{item.price}</p>
              </div>

              <div className="item-quantity">
                <label htmlFor={`qty-${item._id}`}>Quantity:</label>
                <div className="quantity-control">
                  <button
                    onClick={() => updateQuantity(item._id, (item.quantity || 1) - 1)}
                    className="qty-btn"
                  >
                    -
                  </button>
                  <input
                    id={`qty-${item._id}`}
                    type="number"
                    min="1"
                    max={item.stock || 10}
                    value={item.quantity || 1}
                    onChange={(e) => updateQuantity(item._id, parseInt(e.target.value) || 1)}
                    className="qty-input"
                  />
                  <button
                    onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)}
                    className="qty-btn"
                    disabled={(item.quantity || 1) >= (item.stock || 10)}
                  >
                    +
                  </button>
                </div>
                <p className="stock-info">Stock available: {item.stock || 10}</p>
              </div>

              <div className="item-total">
                <p>₹{(item.price * (item.quantity || 1)).toFixed(2)}</p>
              </div>

              <button
                onClick={() => removeFromCart(item._id)}
                className="btn-remove"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal ({cart.length} items):</span>
            <span>₹{getTotalPrice().toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping:</span>
            <span className="shipping-free">FREE</span>
          </div>
          <div className="summary-row tax">
            <span>Estimated Tax:</span>
            <span>₹{(getTotalPrice() * 0.05).toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>₹{(getTotalPrice() * 1.05).toFixed(2)}</span>
          </div>

          <button onClick={handleCheckout} className="btn-checkout">
            Proceed to Checkout
          </button>

          <button onClick={() => setPage("home")} className="btn-continue">
            Continue Shopping
          </button>

          <button onClick={clearCart} className="btn-clear">
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart
