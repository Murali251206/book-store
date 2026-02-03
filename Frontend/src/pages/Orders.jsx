import React, { useState, useEffect, useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import { API } from "../api"
import "../styles/Orders.css"

function Orders() {
  const { token } = useContext(AuthContext)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [returnReason, setReturnReason] = useState({})
  const [showReturnForm, setShowReturnForm] = useState({})
  const [returnTimers, setReturnTimers] = useState({})
  const RETURN_WINDOW_MINUTES = 1/4

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(() => {
      setReturnTimers({ ...returnTimers })
    }, 1000)
    return () => clearInterval(interval)
  }, [token])

  const isReturnWindowActive = (order) => {
    if (order.status !== "Delivered" || order.returnStatus !== "None") {
      return false
    }
    
    const deliveredTime = new Date(order.updatedAt).getTime()
    const currentTime = new Date().getTime()
    const timeDifference = (currentTime - deliveredTime) / (1000 * 60 * 60 * 24) 

    return timeDifference < RETURN_WINDOW_MINUTES
  }

  const getReturnTimeRemaining = (order) => {
    if (!isReturnWindowActive(order)) return null
    
    const deliveredTime = new Date(order.updatedAt).getTime()
    const currentTime = new Date().getTime()
    const timeDifference = (currentTime - deliveredTime) / 1000 
    const secondsRemaining = Math.floor(RETURN_WINDOW_MINUTES * 24 * 60 * 60 - timeDifference)
    
    if (secondsRemaining <= 0) return null
    
    const days = Math.floor(secondsRemaining / (24 * 60 * 60))
    const hours = Math.floor((secondsRemaining % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60)
    const seconds = secondsRemaining % 60
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`
  }

  const fetchOrders = async () => {
    try {
      if (!token) {
        setError("Please login to view orders")
        setLoading(false)
        return
      }

      const res = await fetch(`${API}/orders/user/myorders`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!res.ok) {
        throw new Error("Failed to fetch orders")
      }

      const data = await res.json()
      setOrders(data)
    } catch (err) {
      setError(err.message)
      console.error("Error fetching orders:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return
    }

    try {
      const res = await fetch(`${API}/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.msg || "Failed to cancel order")
      }

      setSuccess("Order cancelled successfully!")
      setError("")
      fetchOrders()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.message)
      setSuccess("")
    }
  }

  const handleReturnRequest = async (orderId) => {
    const reason = returnReason[orderId]?.trim()
    
    if (!reason) {
      setError("Please provide a reason for return")
      return
    }

    try {
      const res = await fetch(`${API}/orders/${orderId}/return-request`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.msg || "Failed to submit return request")
      }

      setSuccess("Return request submitted successfully!")
      setError("")
      setShowReturnForm({ ...showReturnForm, [orderId]: false })
      setReturnReason({ ...returnReason, [orderId]: "" })
      fetchOrders()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.message)
      setSuccess("")
    }
  }

  const getReturnStatusColor = (status) => {
    switch (status) {
      case "Requested":
        return "#ffc107"
      case "Approved":
        return "#17a2b8"
      case "Returned":
        return "#007bff"
      case "Refunded":
        return "#28a745"
      case "Rejected":
        return "#dc3545"
      default:
        return "#6c757d"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#ffc107"
      case "Processing":
        return "#17a2b8"
      case "Shipped":
        return "#007bff"
      case "Delivered":
        return "#28a745"
      case "Cancelled":
        return "#dc3545"
      default:
        return "#6c757d"
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  if (loading) {
    return <div className="loading-container">Loading your orders...</div>
  }

  return (
    <div className="orders-container">
      <h2>My Orders</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>You haven't placed any orders yet.</p>
          <p>Start shopping now!</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order #{order._id.slice(-8).toUpperCase()}</h3>
                  <p className="order-date">{formatDate(order.createdAt)}</p>
                </div>
                <div className="order-status" style={{ borderColor: getStatusColor(order.status) }}>
                  <span style={{ color: getStatusColor(order.status) }}>{order.status}</span>
                </div>
              </div>

              <div className="order-items">
                <h4>Items</h4>
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item">
                    <div>
                      <p className="item-title">{item.title}</p>
                      <p className="item-author">by {item.author}</p>
                    </div>
                    <div className="item-details">
                      <span className="qty">Qty: {item.quantity || 1}</span>
                      <span className="price">₹{(item.price * (item.quantity || 1)).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-delivery">
                <h4>Delivery Address</h4>
                <div className="address-info">
                  <p><strong>{order.addressDetails.name}</strong></p>
                  <p>{order.addressDetails.address}</p>
                  <p>
                    {order.addressDetails.city}, {order.addressDetails.state}{" "}
                    {order.addressDetails.district}
                  </p>
                  <p>Mobile: {order.addressDetails.mobile}</p>
                </div>
              </div>

              <div className="order-footer">
                <div className="payment-info">
                  <p>Payment Method: <strong>{order.paymentMethod}</strong></p>
                  <p className="total">
                    Total Amount: <strong>₹{order.totalAmount.toFixed(2)}</strong>
                  </p>
                </div>
                <div className="order-actions">
                  {order.status === "Pending" && (
                    <button
                      className="btn-cancel-order"
                      onClick={() => handleCancelOrder(order._id)}
                    >
                    Cancel Order
                    </button>
                  )}
                  {isReturnWindowActive(order) && (
                    <div className="return-window-active">
                      <button
                        className="btn-return-request"
                        onClick={() => setShowReturnForm({ ...showReturnForm, [order._id]: !showReturnForm[order._id] })}
                      >
                        Request Return
                      </button>
                      <span className="return-timer">{getReturnTimeRemaining(order)}</span>
                    </div>
                  )}
                  {order.status === "Delivered" && !isReturnWindowActive(order) && order.returnStatus === "None" && (
                    <div className="return-window-expired">
                      <p>Return expired</p>
                    </div>
                  )}
                </div>
              </div>

              {showReturnForm[order._id] && isReturnWindowActive(order) && (
                <div className="return-form-section">
                  <h5>Return Request Form</h5>
                  <textarea
                    className="return-reason-input"
                    placeholder="Please provide reason for return..."
                    value={returnReason[order._id] || ""}
                    onChange={(e) => setReturnReason({ ...returnReason, [order._id]: e.target.value })}
                    rows="3"
                  />
                  <div className="return-form-buttons">
                    <button
                      className="btn-submit-return"
                      onClick={() => handleReturnRequest(order._id)}
                    >
                      Submit Return Request
                    </button>
                    <button
                      className="btn-cancel-return"
                      onClick={() => setShowReturnForm({ ...showReturnForm, [order._id]: false })}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {order.returnStatus !== "None" && (
                <div className="return-status-section" style={{ borderLeftColor: getReturnStatusColor(order.returnStatus) }}>
                  <div className="return-status-header">
                    <h5>Return Status</h5>
                    <span className="return-status-badge" style={{ backgroundColor: getReturnStatusColor(order.returnStatus) }}>
                      {order.returnStatus}
                    </span>
                  </div>
                  {order.returnReason && (
                    <p><strong>Reason:</strong> {order.returnReason}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders
