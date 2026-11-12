import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import "./styles.css";
import { CartProvider } from "./lib/cart.jsx";
import { StoreProvider } from "./lib/store.jsx";
import ShopLayout from "./components/ShopLayout.jsx";
import Catalog from "./pages/Catalog.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import NotFound from "./pages/NotFound.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import Login from "./pages/admin/Login.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import Products from "./pages/admin/Products.jsx";
import Categories from "./pages/admin/Categories.jsx";
import Orders from "./pages/admin/Orders.jsx";
import Settings from "./pages/admin/Settings.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <CartProvider>
          <Routes>
            <Route element={<ShopLayout />}>
              <Route index element={<Catalog />} />
              <Route path="produk/:slug" element={<ProductDetail />} />
              <Route path="keranjang" element={<Cart />} />
              <Route path="pesanan/:code" element={<OrderSuccess />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="admin/login" element={<Login />} />
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="produk" element={<Products />} />
              <Route path="kategori" element={<Categories />} />
              <Route path="pesanan" element={<Orders />} />
              <Route path="pengaturan" element={<Settings />} />
            </Route>
          </Routes>
        </CartProvider>
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode>
);
