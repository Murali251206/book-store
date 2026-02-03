import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import "../styles/Admin.css";

const API = "http://localhost:5000/api";

function Admin() {
  const { user, token } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("books");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    price: "",
    description: "",
    category: "Programming",
    image: "",
    stock: "10",
  });

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/books`);
      setBooks(res.data);
    } catch (err) {
      setError("Failed to fetch books");
    }
    setLoading(false);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/orders/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      setError("Failed to fetch orders");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks();
    fetchOrders();
  }, [token]);

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-container">
        <div className="error-message">
          Access Denied! Only admins can access this page.
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title || !formData.author || !formData.price) {
      setError("Title, Author, and Price are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingId) {
        await axios.put(
          `${API}/books/${editingId}`,
          formData,
          config
        );
        setSuccess("Book updated successfully!");
      } else {
        await axios.post(`${API}/books`, formData, config);
        setSuccess("Book added successfully!");
      }

      setFormData({
        title: "",
        author: "",
        price: "",
        description: "",
        category: "Programming",
        image: "",
        stock: "10",
      });
      setShowForm(false);
      setEditingId(null);
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.msg || "Error saving book");
    }
  };

  const handleEdit = (book) => {
    setFormData({
      title: book.title,
      author: book.author,
      price: book.price,
      description: book.description,
      category: book.category,
      image: book.image || "",
      stock: book.stock,
    });
    setEditingId(book._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`${API}/books/${id}`, config);
        setSuccess("Book deleted successfully!");
        fetchBooks();
      } catch (err) {
        setError("Failed to delete book");
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: "",
      author: "",
      price: "",
      description: "",
      category: "Programming",
      image: "",
      stock: "10",
    });
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API}/orders/${orderId}`, { status: newStatus }, config);
      setSuccess("Order status updated successfully!");
      fetchOrders();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to update order status");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleApproveReturn = async (orderId) => {
    if (!window.confirm("Approve this return request?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API}/orders/${orderId}/return/approve`, {}, config);
      setSuccess("Return request approved!");
      setError("");
      fetchOrders();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to approve return");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleRejectReturn = async (orderId) => {
    if (!window.confirm("Reject this return request?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API}/orders/${orderId}/return/reject`, {}, config);
      setSuccess("Return request rejected!");
      setError("");
      fetchOrders();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to reject return");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${API}/orders/${orderId}`, { status: "Cancelled" }, config);
      setSuccess("Order cancelled successfully!");
      setError("");
      fetchOrders();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to cancel order");
      setTimeout(() => setError(""), 3000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#ffc107";
      case "Processing":
        return "#17a2b8";
      case "Shipped":
        return "#007bff";
      case "Delivered":
        return "#28a745";
      case "Cancelled":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === "books" ? "active" : ""}`}
          onClick={() => setActiveTab("books")}
        >
          Books Management
        </button>
        <button 
          className={`tab-button ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Orders Management
        </button>
      </div>

      {activeTab === "books" && (
        <>
      <div className="admin-header">
        <h2>Total Books: {books.length}</h2>
        {!showForm && (
          <button
            className="btn-add-book"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
            }}
          >
            ➕ Add New Book
          </button>
        )}
      </div>

      {showForm && (
        <div className="book-form-container">
          <h3>{editingId ? "Edit Book" : "Add New Book"}</h3>
          <form onSubmit={handleSubmit} className="book-form">
            <div className="form-row">
              <div className="form-group">
                <label>Book Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter book title"
                />
              </div>
              <div className="form-group">
                <label>Author *</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Enter author name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="Programming">Programming</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Artificial intelligence ">Artificial intelligence </option>
                  <option value="Children Book">Children Book</option>
                  <option value="History">History</option>
                  <option value="Story">Story</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Image URL</label>
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            <div className="form-buttons">
              <button type="submit" className="btn-submit">
                {editingId ? "Update Book" : "Add Book"}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="books-section">
        <h3>All Books</h3>
        {loading ? (
          <p>Loading books...</p>
        ) : books.length === 0 ? (
          <p>No books available. Add your first book!</p>
        ) : (
          <div className="books-table-container">
            <table className="books-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book._id}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.category}</td>
                    <td>₹{book.price}</td>
                    <td>{book.stock}</td>
                    <td>
                      {(book.stock || 0) > 0 ? (
                        <span className="badge-available">Yes</span>
                      ) : (
                        <span className="badge-unavailable">No</span>
                      )}
                    </td>
                    <td className="actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(book)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(book._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      {activeTab === "orders" && (
        <div className="orders-section">
          <h2>All Orders</h2>
          {loading ? (
            <p className="loading-text">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="no-orders">
              <p>No orders yet.</p>
            </div>
          ) : (
            <div className="orders-list-admin">
              {orders.map((order) => (
                <div key={order._id} className="order-card-admin">
                  <div className="order-header-admin">
                    <div className="order-id-section">
                      <h4>Order #{order._id.slice(-8).toUpperCase()}</h4>
                      <p className="order-date">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="customer-section">
                      <p><strong>Customer:</strong> {order.userId?.username || "N/A"}</p>
                      <p><strong>Email:</strong> {order.userId?.email || "N/A"}</p>
                    </div>
                  </div>

                  <div className="order-content-admin">
                    <div className="order-items-section">
                      <h5>Items</h5>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="order-item-admin">
                          <span>{item.title} (Qty: {item.quantity || 1})</span>
                          <span className="price">₹{(item.price * (item.quantity || 1)).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="payment-method-info">
                        <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                      </div>
                      <div className="total-amount">
                        <strong>Total: ₹{order.totalAmount.toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="address-section">
                      <h5>Delivery Address</h5>
                      <p><strong>{order.addressDetails.name}</strong></p>
                      <p>{order.addressDetails.address}</p>
                      <p>{order.addressDetails.city}, {order.addressDetails.state} {order.addressDetails.district}</p>
                      <p>{order.addressDetails.mobile}</p>
                    </div>

                    <div className="status-section">
                      <h5>Order Status</h5>
                      <div className="status-control">
                        <div 
                          className="current-status"
                          style={{ borderColor: getStatusColor(order.status) }}
                        >
                          <span style={{ color: getStatusColor(order.status) }}>
                            {order.status}
                          </span>
                        </div>
                        <div className="status-buttons">
                          {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => (
                            <button
                              key={status}
                              className={`status-btn ${order.status === status ? "active" : ""}`}
                              onClick={() => handleUpdateOrderStatus(order._id, status)}
                              disabled={updatingOrderId === order._id}
                              style={order.status === status ? { backgroundColor: getStatusColor(status), color: "white" } : {}}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      {order.returnStatus && order.returnStatus !== "None" && (
                        <div className="return-status-admin">
                          <h6>Return Status: <span style={{ color: getStatusColor(order.returnStatus) }}>{order.returnStatus}</span></h6>
                          {order.returnReason && <p><strong>Reason:</strong> {order.returnReason}</p>}
                          
                          {order.returnStatus === "Requested" && (
                            <div className="return-action-buttons">
                              <button 
                                className="btn-approve-return" 
                                onClick={() => handleApproveReturn(order._id)}
                              >
                                Approve Return
                              </button>
                              <button 
                                className="btn-reject-return" 
                                onClick={() => handleRejectReturn(order._id)}
                              >
                                Reject Return
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {order.status !== "Cancelled" && (
                        <button 
                          className="btn-cancel-admin-order"
                          onClick={() => handleCancelOrder(order._id)}
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Admin;
