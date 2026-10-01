import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Recommendations from "./pages/Recommendations";

export default function App() {
  return (
    <div className="min-h-screen lg:flex">
      <Navbar />
      <main className="flex-1 px-5 sm:px-8 py-8 max-w-6xl">
        <div className="h-1 spark rounded-full mb-8 opacity-80" />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/recommendations" element={<Recommendations />} />
        </Routes>
      </main>
    </div>
  );
}
