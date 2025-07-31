import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <ul className="flex space-x-4">
        <li>
          <Link to="/" className="text-white">
            Home
          </Link>
        </li>
        <li>
          <Link to="/login" className="text-white">
            Login
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
