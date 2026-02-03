import React, { createContext, useState, useEffect } from "react"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    const savedUser = localStorage.getItem("user")
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = async (username, password) => {
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.msg || "Login failed")

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify({
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role
      }))

      setToken(data.token)
      setUser({
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role
      })

      return { success: true }
    } catch (error) {
      return { success: false, msg: error.message }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (username, email, password) => {
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.msg || "Registration failed")

      return { success: true }
    } catch (error) {
      return { success: false, msg: error.message }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
