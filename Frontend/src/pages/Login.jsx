import React, { useState, useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import "../styles/Auth.css"

function Login({ setPage }) {
  const { login, isLoading } = useContext(AuthContext)
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  })
  const [error, setError] = useState("")
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetData, setResetData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [resetMessage, setResetMessage] = useState("")
  const [resetError, setResetError] = useState("")
  const [resettingPassword, setResettingPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")

    if (!formData.username || !formData.password) {
      setError("Username and password are required")
      return
    }

    const result = await login(formData.username, formData.password)

    if (result.success) {
      setPage("home")
    } else {
      setError(result.msg)
    }
  }

  const handleResetChange = (e) => {
    const { name, value } = e.target
    setResetData(prev => ({ ...prev, [name]: value }))
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setResetError("")
    setResetMessage("")

    if (!resetData.email) {
      setResetError("Email is required")
      return
    }

    if (!resetData.newPassword || !resetData.confirmPassword) {
      setResetError("Both password fields are required")
      return
    }

    if (resetData.newPassword !== resetData.confirmPassword) {
      setResetError("Passwords do not match")
      return
    }

    if (resetData.newPassword.length < 6) {
      setResetError("Password must be at least 6 characters long")
      return
    }

    setResettingPassword(true)

    try {
      const response = await fetch("https://book-store-backend-rg5z.onrender.com/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: resetData.email,
          newPassword: resetData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResetMessage(data.msg)
        setResetData({ email: "", newPassword: "", confirmPassword: "" })
        setTimeout(() => {
          setShowResetModal(false)
          setResetMessage("")
        }, 2000)
      } else {
        setResetError(data.msg || "Password reset failed")
      }
    } catch (err) {
      setResetError("Error resetting password. Please try again.")
      console.error("Reset password error:", err)
    } finally {
      setResettingPassword(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <p className="forgot-password-link">
            <span onClick={() => setShowResetModal(true)} style={{ cursor: "pointer", color: "#667eea" }}>
              Forgot Password?
            </span>
          </p>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account?{" "}
          <span onClick={() => setPage("register")} style={{ cursor: "pointer", color: "#007bff" }}>
            Register
          </span>
        </p>
      </div>

      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowResetModal(false)
                  setResetData({ email: "", newPassword: "", confirmPassword: "" })
                  setResetError("")
                  setResetMessage("")
                }}
              >
              </button>
            </div>

            <div className="modal-body">
              {resetMessage && <div className="alert alert-success">{resetMessage}</div>}
              {resetError && <div className="alert alert-danger">{resetError}</div>}

              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label htmlFor="reset-email">Email Address</label>
                  <input
                    id="reset-email"
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={resetData.email}
                    onChange={handleResetChange}
                    disabled={resettingPassword}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    name="newPassword"
                    placeholder="Enter new password"
                    value={resetData.newPassword}
                    onChange={handleResetChange}
                    disabled={resettingPassword}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    value={resetData.confirmPassword}
                    onChange={handleResetChange}
                    disabled={resettingPassword}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowResetModal(false)
                      setResetData({ email: "", newPassword: "", confirmPassword: "" })
                      setResetError("")
                      setResetMessage("")
                    }}
                    disabled={resettingPassword}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={resettingPassword}>
                    {resettingPassword ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
