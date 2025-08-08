import { Link } from "react-router-dom";
import React from "react";
import useAuth from "../context/useAuth";
import { useNotification } from "../context/useNotification";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { showNotification } = useNotification();
  
  return (
    <nav className="bg-gray-800 p-4">
      <ul className="flex space-x-4">
        <li>
          <Link to="/" className="text-white">
            Home
          </Link>
        </li>
        {isAuthenticated ? (
          <>
            <li>
              <Link to="/dashboard" className="text-white">
                Dashboard
              </Link>
            </li>
            <li>
              <button
                onClick={() => {
                  showNotification("You have been logged out successfully.");
                  logout();
                }}
                className="text-white bg-transparent border-none cursor-pointer hover:text-gray-300"
              >
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login" className="text-white">
                Login
              </Link>
            </li>
            <li>
              <Link to="/register" className="text-white">
                Register
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
