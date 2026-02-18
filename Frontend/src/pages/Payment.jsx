import React, { useState, useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import { CartContext } from "../context/CartContext"
import { API } from "../api"
import qrCodeImage from "../assets/upi-qr.png"
import "../styles/Payment.css"

function Payment({ buyItem, setOrders, setPage }) {
  const { token } = useContext(AuthContext)
  const { clearCart } = useContext(CartContext)
  const [method, setMethod] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: ""
  })

  const total = buyItem.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
  const taxAmount = total * 0.01
  const finalAmount = total + taxAmount

  const handleCardChange = (e) => {
    const { name, value } = e.target
    let formattedValue = value

    if (name === "cardNumber") {
      formattedValue = value.replace(/\s/g, "").replace(/(\d{4})/g, "$1 ").trim()
    } else if (name === "expiryDate") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4)
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + "/" + formattedValue.slice(2)
      }
    } else if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "").slice(0, 3)
    }

    setCardDetails(prev => ({ ...prev, [name]: formattedValue }))
  }

  const validateCardDetails = () => {
    if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, "").length !== 16) {
      setError("Invalid card number")
      return false
    }
    if (!cardDetails.cardName) {
      setError("Cardholder name is required")
      return false
    }
    if (!cardDetails.expiryDate || cardDetails.expiryDate.length !== 5) {
      setError("Invalid expiry date (MM/YY)")
      return false
    }
    if (!cardDetails.cvv || cardDetails.cvv.length !== 3) {
      setError("Invalid CVV")
      return false
    }
    return true
  }

  const confirmPayment = async () => {
    setError("")

    if (!method) {
      setError("Please select a payment method")
      return
    }

    if (method === "Card" && !validateCardDetails()) {
      return
    }

    setIsProcessing(true)

    try {
      const formattedItems = buyItem.items.map(item => ({
        bookId: item._id,
        title: item.title,
        author: item.author,
        price: item.price,
        quantity: item.quantity || 1
      }))

      const orderResponse = await fetch(`${API}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          items: formattedItems,
          addressDetails: buyItem.addressDetails,
          paymentMethod: method,
          totalAmount: finalAmount
        })
      })

      if (!orderResponse.ok) {
        throw new Error("Failed to create order")
      }

      const orderData = await orderResponse.json()

      if (method === "Card") {
        const paymentResponse = await fetch(`${API}/payment/create-payment-intent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: finalAmount,
            orderId: orderData._id
          })
        })

        if (!paymentResponse.ok) {
          throw new Error("Payment processing failed")
        }

        const paymentData = await paymentResponse.json()

        const confirmResponse = await fetch(`${API}/payment/confirm-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentIntentId: paymentData.paymentIntentId,
            orderId: orderData._id
          })
        })

        if (!confirmResponse.ok) {
          throw new Error("Payment confirmation failed")
        }

        const confirmData = await confirmResponse.json()

        if (!confirmData.success) {
          throw new Error(confirmData.msg)
        }
      }

      setOrders(prev => [...prev, orderData])
      clearCart()

      alert("Order placed successfully!")
      setPage("orders")
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.")
      console.error("Payment error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="payment-container">
      <h2>Payment</h2>

      <div className="payment-content">
        <div className="payment-methods">
          <h3>Select Payment Method</h3>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="method-option">
            <label>
              <input
                type="radio"
                value="Card"
                checked={method === "Card"}
                onChange={(e) => {
                  setMethod(e.target.value)
                  setError("")
                }}
              />
              <span>Credit/Debit Card</span>
            </label>
          </div>

          {method === "Card" && (
            <div className="card-form">
              <div className="form-group">
                <label htmlFor="cardNumber">Card Number</label>
                <input
                  id="cardNumber"
                  name="cardNumber"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.cardNumber}
                  onChange={handleCardChange}
                  maxLength="19"
                />
              </div>

              <div className="form-group">
                <label htmlFor="cardName">Cardholder Name</label>
                <input
                  id="cardName"
                  name="cardName"
                  type="text"
                  placeholder="Accounter name"
                  value={cardDetails.cardName}
                  onChange={handleCardChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expiryDate">Expiry Date</label>
                  <input
                    id="expiryDate"
                    name="expiryDate"
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiryDate}
                    onChange={handleCardChange}
                    maxLength="5"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cvv">CVV</label>
                  <input
                    id="cvv"
                    name="cvv"
                    type="text"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={handleCardChange}
                    maxLength="3"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="method-option">
            <label>
              <input
                type="radio"
                value="UPI"
                checked={method === "UPI"}
                onChange={(e) => {
                  setMethod(e.target.value)
                  setError("")
                }}
              />
              <span>UPI</span>
            </label>
          </div>

          {method === "UPI" && (
            <div className="upi-qr-container">
              <p className="upi-instructions">Scan the QR code below with your UPI app:</p>
              <img src={qrCodeImage} alt="UPI QR Code" className="upi-qr-code" />
            </div>
          )}

          <div className="method-option">
            <label>
              <input
                type="radio"
                value="Cash"
                checked={method === "Cash"}
                onChange={(e) => {
                  setMethod(e.target.value)
                  setError("")
                }}
              />
              <span>Cash on Delivery</span>
            </label>
          </div>

          <div className="button-group">
            <button onClick={() => setPage("address")} className="btn-back">
              Back to Address
            </button>
            <button
              onClick={confirmPayment}
              className="btn-pay"
              disabled={isProcessing || !method}
            >
              {isProcessing ? "Processing..." : `Pay ₹${finalAmount.toFixed(2)}`}
            </button>
          </div>
        </div>

        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-items">
            {buyItem.items.map((item) => (
              <div key={item._id} className="summary-item">
                <div>
                  <p className="item-name">{item.title}</p>
                  <p className="item-qty">Qty: {item.quantity || 1}</p>
                </div>
                <p className="item-price">₹{(item.price * (item.quantity || 1)).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="address-summary">
            <h4>Delivery Address</h4>
            <p>{buyItem.addressDetails?.name}</p>
            <p>{buyItem.addressDetails?.address}</p>
            <p>
              {buyItem.addressDetails?.city}, {buyItem.addressDetails?.state}{" "}
              {buyItem.addressDetails?.district}
            </p>
            <p>Mobile: {buyItem.addressDetails?.mobile}</p>
          </div>

          <div className="summary-total">
            <p>
              <span>Subtotal:</span>
              <strong>₹{total.toFixed(2)}</strong>
            </p>
            <p>
              <span>Tax (1%):</span>
              <strong>₹{taxAmount.toFixed(2)}</strong>
            </p>
            <p>
              <span>Delivery charges:</span>
              <strong>Free</strong></p>
            <p className="grand-total">
              <span>Total Amount:</span>
              <strong>₹{finalAmount.toFixed(2)}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payment
