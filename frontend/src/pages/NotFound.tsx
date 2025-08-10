import { Link, useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";

const NotFound = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="text-4xl font-bold text-gray-800 mt-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mt-4 text-lg">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Go Back
          </button>
          
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors inline-block"
          >
            {isAuthenticated ? "Go to Dashboard" : "Go to Home"}
          </Link>
        </div>
        
        <div className="mt-12">
          <p className="text-gray-500 text-sm">
            Need help? Contact support or check our FAQ.
          </p>
        </div>
      </div>
    </main>
  );
};

export default NotFound;