// Screen/CartContext.js
import React, { createContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  // Load the logged-in user's ID from AsyncStorage
  const loadUserId = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserId(user._id || user.id);
      } else {
        setUserId(null);
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading user id:', error);
    }
  };

  // Expose this function so that external components (e.g. LoginScreen) can refresh user data.
  const refreshUser = async () => {
    await loadUserId();
  };

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCartFromDB();
    } else {
      setCartItems([]);
    }
  }, [userId]);

  const fetchCartFromDB = async () => {
    try {
      const response = await fetch(`https://dashboard-backend-xrss.vercel.app/api/cart?userId=${userId}`);
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (data && data.cartItems) {
          setCartItems(data.cartItems);
        } else {
          setCartItems([]);
        }
      } else {
        const text = await response.text();
        throw new Error("Expected JSON but received: " + text);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const persistCart = async (newCart) => {
    if (!userId) return;
    try {
      const response = await fetch("https://dashboard-backend-xrss.vercel.app/api/cart", {
        method: "POST", // Change to PUT if needed.
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, cart: newCart }),
      });
      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      console.log("Cart persisted:", data);
    } catch (error) {
      console.error("Error saving cart:", error);
    }
  };

  // When adding to cart, store two fields:
  // - cartQuantity: number of items added to the cart
  // - availableStock: available stock from the product (medicine.quantity)
  const addToCart = (medicine) => {
    setCartItems(prevCart => {
      const index = prevCart.findIndex(
        (item) => (item._id || item.id) === (medicine._id || medicine.id)
      );
      let updatedCart;
      if (index >= 0) {
        updatedCart = [...prevCart];
        const currentItem = updatedCart[index];
        if (currentItem.cartQuantity < currentItem.availableStock) {
          updatedCart[index].cartQuantity = currentItem.cartQuantity + 1;
        } else {
          Alert.alert("Stock Limit", "No additional stock available for this product.");
        }
      } else {
        // Create a new cart item with cartQuantity set to 1 and store availableStock.
        updatedCart = [
          ...prevCart,
          { ...medicine, cartQuantity: 1, availableStock: medicine.quantity }
        ];
      }
      persistCart(updatedCart);
      return updatedCart;
    });
  };

  const removeFromCart = (id) => {
    setCartItems(prevCart => {
      const updatedCart = prevCart.filter(item => (item._id || item.id) !== id);
      persistCart(updatedCart);
      return updatedCart;
    });
  };

  const updateQuantity = (id, action) => {
    setCartItems(prevCart => {
      const updatedCart = prevCart.map(item => {
        if ((item._id || item.id) === id) {
          const currentQty = item.cartQuantity || 1;
          if (action === "increase") {
            if (currentQty < item.availableStock) {
              return { ...item, cartQuantity: currentQty + 1 };
            } else {
              Alert.alert("Stock Limit", "No additional stock available for this product.");
              return item;
            }
          } else {
            return { ...item, cartQuantity: Math.max(currentQty - 1, 1) };
          }
        }
        return item;
      });
      persistCart(updatedCart);
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    persistCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        userId,
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshUser,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;
