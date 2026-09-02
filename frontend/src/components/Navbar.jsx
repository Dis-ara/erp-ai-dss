import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `px-4 py-2 rounded-md text-sm font-medium ${
    isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-200"
  }`;

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        <span className="font-bold text-lg text-slate-800">ERP AI Decision Support</span>
        <div className="flex gap-2">
          <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/products" className={linkClass}>Products</NavLink>
          <NavLink to="/suppliers" className={linkClass}>Suppliers</NavLink>
          <NavLink to="/recommendations" className={linkClass}>AI Recommendations</NavLink>
        </div>
      </div>
    </nav>
  );
}
