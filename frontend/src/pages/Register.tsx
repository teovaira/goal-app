import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useNotification } from "../context/useNotification";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import axios, { AxiosError } from "axios";
import useAuth from "../context/useAuth";
import { handleGoogleSuccess } from "../services/googleAuth";
import { validateEmail, validatePassword } from "../utils/validation";
import { API_ENDPOINTS } from "../config/api";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<{ name: string; email: string; password: string }>({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [googleError, setGoogleError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    setError({ name: "", email: "", password: "" });
    setSuccessMessage("");

    let hasError = false;
    setIsLoading(true);

    if (!name.trim()) {
      setError((prev) => ({ ...prev, name: "Name is required." }));
      hasError = true;
    } else if (name.trim().length < 2) {
      setError((prev) => ({ ...prev, name: "Name must be at least 2 characters long." }));
      hasError = true;
    }

    if (!email) {
      setError((prev) => ({ ...prev, email: "Email is required." }));
      hasError = true;
    } else if (!validateEmail(email)) {
      setError((prev) => ({
        ...prev,
        email: "Please enter a valid email address.",
      }));
      hasError = true;
    }

    if (!password) {
      setError((prev) => ({ ...prev, password: "Password is required." }));
      hasError = true;
    } else if (!validatePassword(password)) {
      setError((prev) => ({
        ...prev,
        password:
          "Password must be at least 8 characters long, contain 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character.",
      }));
      hasError = true;
    }

    if (hasError) {
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(
        API_ENDPOINTS.register,
        {
          name: name.trim(),
          email,
          password,
        }
      );

      showNotification("Registration successful! Welcome to Goal Tracker.");
      setName("");
      setEmail("");
      setPassword("");
      
      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        if (err.response) {
          const status = err.response.status;
          if (status === 400) {
            if (err.response.data.message?.includes("email")) {
              setError((prev) => ({
                ...prev,
                email: "Email already exists. Please use a different email.",
              }));
            } else if (err.response.data.message?.includes("name")) {
              setError((prev) => ({
                ...prev,
                name: "Invalid name format.",
              }));
            } else {
              setError((prev) => ({
                ...prev,
                email: "Registration failed. Please check your information.",
              }));
            }
          }
        } else if (err.request) {
          setError((prev) => ({
            ...prev,
            email: "Network error, please try again.",
          }));
        } else {
          setError((prev) => ({
            ...prev,
            email: "Something went wrong, please try again later.",
          }));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex justify-center items-center h-screen bg-gray-200">
      <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-lg w-full">
        <h1 className="text-3xl font-semibold">Register</h1>
        <p className="mt-4 mb-6">Create your account to get started.</p>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-left text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your full name"
              aria-invalid={!!error.name}
              aria-describedby={error.name ? "name-error" : undefined}
            />
            {error.name && (
              <p id="name-error" className="text-red-500 text-sm" role="alert">{error.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-left text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your email"
              aria-invalid={!!error.email}
              aria-describedby={error.email ? "email-error" : undefined}
            />
            {error.email && (
              <p id="email-error" className="text-red-500 text-sm" role="alert">{error.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-left text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your password"
                aria-invalid={!!error.password}
                aria-describedby={error.password ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
            {error.password && (
              <p id="password-error" className="text-red-500 text-sm" role="alert">{error.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 mt-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 relative disabled:opacity-50"
          >
            {isLoading ? (
              <div className="spinner visible absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            ) : (
              "Register"
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                setGoogleError("");
                setIsLoading(true);
                try {
                  await handleGoogleSuccess(credentialResponse, login, navigate, true, showNotification);
                } catch (error) {
                  setGoogleError(error instanceof Error ? error.message : "Google registration failed");
                  setIsLoading(false);
                }
              }}
              onError={() => {
                setGoogleError("Google registration failed");
              }}
              theme="outline"
              size="large"
              width="100%"
              text="signup_with"
            />
            {googleError && (
              <p className="mt-2 text-red-500 text-sm">{googleError}</p>
            )}
          </div>
        </div>

        <p className="mt-4 text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Register;