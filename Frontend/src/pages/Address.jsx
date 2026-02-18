import React, { useState, useEffect, useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import "../styles/Address.css"

const API = "https://book-store-backend-rg5z.onrender.com/api"

function Address({ buyItem, setBuyItem, setPage }) {
  const { user, token } = useContext(AuthContext)
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
    district: "",
  })
  const [errors, setErrors] = useState({})
  const [savedAddresses, setSavedAddresses] = useState([])
  const [isAddingNew, setIsAddingNew] = useState(true)
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (token && user) {
      fetchAddresses()
    }
  }, [token, user])

  const fetchAddresses = async () => {
    try {
      const response = await fetch(`${API}/auth/addresses`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const addresses = await response.json()
        setSavedAddresses(addresses)
      } else if (response.status === 401) {
        console.error("Unauthorized - Please login again")
      }
    } catch (error) {
      console.error("Error fetching addresses:", error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const validate = () => {
    const newErrors = {}

    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.mobile.trim()) newErrors.mobile = "Mobile number is required"
    if (!/^[0-9]{10}$/.test(form.mobile)) newErrors.mobile = "Mobile must be 10 digits"
    if (!form.email.trim()) newErrors.email = "Email is required"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Invalid email"
    if (!form.address.trim()) newErrors.address = "Address is required"
    if (!form.city.trim()) newErrors.city = "City is required"
    if (!form.state.trim()) newErrors.state = "State is required"
    if (!form.district.trim()) newErrors.district = "District is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinuePayment = async () => {
    if (validate()) {
      setIsLoading(true)
      try {
        if (selectedAddressId) {
          const response = await fetch(`${API}/auth/addresses/${selectedAddressId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(form)
          })

          if (response.ok) {
            await fetchAddresses()
          } else {
            console.error("Error updating address")
            return
          }
        } else {
          const response = await fetch(`${API}/auth/addresses`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(form)
          })

          if (response.ok) {
            await fetchAddresses()
          } else {
            console.error("Error saving address")
            return
          }
        }

        setBuyItem({ ...buyItem, addressDetails: form })
        setPage("payment")
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleNewAddress = () => {
    setIsAddingNew(true)
    setSelectedAddressId(null)
    setForm({
      name: "",
      mobile: "",
      email: "",
      address: "",
      city: "",
      state: "",
      district: "",
    })
    setErrors({})
  }

  const handleSelectAddress = (address) => {
    setForm(address)
    setSelectedAddressId(address.id)
    setIsAddingNew(false)
    setErrors({})
  }

  const handleDeleteAddress = async (id) => {
    try {
      const response = await fetch(`${API}/auth/addresses/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchAddresses()
        if (selectedAddressId === id) {
          handleNewAddress()
        }
      } else {
        console.error("Error deleting address")
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const total = buyItem.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)

  return (
    <div className="address-container">
      <h2>Delivery Address</h2>

      <div className="address-content">
        <div className="address-form">
          {savedAddresses.length > 0 && (
            <div className="saved-addresses-section">
              <h3>Saved Addresses</h3>
              <div className="saved-addresses-list">
                {savedAddresses.map((address) => (
                  <div 
                    key={address.id}
                    className={`saved-address-card ${selectedAddressId === address.id ? "selected" : ""}`}
                    onClick={() => handleSelectAddress(address)}
                  >
                    <div className="address-card-content">
                      <p className="address-name"><strong>{address.name}</strong></p>
                      <p className="address-text">{address.address}</p>
                      <p className="address-text">{address.city}, {address.district}, {address.state}</p>
                      <p className="address-text">📱 {address.mobile}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteAddress(address.id)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`form-section ${savedAddresses.length > 0 ? "with-saved" : ""}`}>
            <h3>{isAddingNew ? "Add New Address" : "Edit Address"}</h3>
            <form>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter full name"
                value={form.name}
                onChange={handleChange}
                className={errors.name ? "error" : ""}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="mobile">Mobile Number *</label>
                <input 
                  id="mobile"
                  type="tel"
                  name="mobile"
                  placeholder="10-digit mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  className={errors.mobile ? "error" : ""}
                  maxLength="10"
                />
                {errors.mobile && <span className="error-message">{errors.mobile}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={form.email}
                  onChange={handleChange}
                  className={errors.email ? "error" : ""}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <textarea
                id="address"
                name="address"
                placeholder="Enter complete address"
                rows="3"
                value={form.address}
                onChange={handleChange}
                className={errors.address ? "error" : ""}
              />
              {errors.address && <span className="error-message">{errors.address}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  placeholder="Enter city"
                  value={form.city}
                  onChange={handleChange}
                  className={errors.city ? "error" : ""}
                />
                {errors.city && <span className="error-message">{errors.city}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="state">State *</label>
                <input
                  id="state"
                  type="text"
                  name="state"
                  placeholder="Enter state"
                  value={form.state}
                  onChange={handleChange}
                  className={errors.state ? "error" : ""}
                />
                {errors.state && <span className="error-message">{errors.state}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="district">District *</label>
              <input
                id="district"
                type="text"
                name="district"
                placeholder="Enter district"
                value={form.district}
                onChange={handleChange}
                className={errors.district ? "error" : ""}
              />
              {errors.district && <span className="error-message">{errors.district}</span>}
            </div>

            <div className="button-group">
              <button type="button" onClick={() => setPage("cart")} className="btn-back">
                Back to Cart
              </button>
              <button type="button" onClick={handleContinuePayment} className="btn-continue" disabled={isLoading}>
                {isLoading ? "Processing..." : "Continue to Payment"}
              </button>
            </div>
            </form>
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
          <div className="summary-total">
            <p>Subtotal: <strong>₹{total.toFixed(2)}</strong></p>
            <p>Tax (5%): <strong>₹{(total * 0.05).toFixed(2)}</strong></p>
            <p className="grand-total">
              Total: <strong>₹{(total * 1.05).toFixed(2)}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Address
