import React, { createContext, useState, useEffect } from "react"

export const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])

  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart))
  }, [cart])

  const addToCart = (book) => {
    const existingItem = cart.find(item => item._id === book._id)
    const maxStock = book.stock || 10
    if (existingItem) {
      const newQuantity = Math.min((existingItem.quantity || 1) + 1, maxStock)
      setCart(cart.map(item =>
        item._id === book._id
          ? { ...item, quantity: newQuantity }
          : item
      ))
    } else {
      setCart([...cart, { ...book, quantity: 1 }])
    }
  }

  const removeFromCart = (bookId) => {
    setCart(cart.filter(item => item._id !== bookId))
  }

  const updateQuantity = (bookId, quantity) => {
    const item = cart.find(item => item._id === bookId)
    const maxStock = item?.stock || 10
    const limitedQuantity = Math.min(Math.max(quantity, 0), maxStock)
    
    if (limitedQuantity <= 0) {
      removeFromCart(bookId)
    } else {
      setCart(cart.map(item =>
        item._id === bookId ? { ...item, quantity: limitedQuantity } : item
      ))
    }
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0)
  }

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  )
}
