import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import  useAuth from "../context/useAuth";
import { useNotification } from "../context/useNotification";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import axios, { AxiosError } from "axios";
import { handleGoogleSuccess } from "../services/googleAuth";
import { validateEmail, validatePassword } from "../utils/validation";
import { authStorage } from "../utils/authStorage";
import { API_ENDPOINTS } from "../config/api";

const Login = () => {

  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<{ email: string; password: string }>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [googleError, setGoogleError] = useState<string>("");


  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    setError({ email: "", password: "" });

    let hasError = false;
    setIsLoading(true);

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
      const response = await axios.post(
        API_ENDPOINTS.login,
        {
          email,
          password,
        }
      );

      const { token, _id, name, email: userEmail } = response.data;
      const userData = { _id, name, email: userEmail };
      authStorage.setAuthData(token, userData);

      showNotification("Welcome back! Login successful.");
      login(navigate);

      setEmail("");
      setPassword("");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        if (err.response) {
          const status = err.response.status;
          if (status === 400 || status === 401) {
            if (err.response.data.message === "Invalid email") {
              setError((prev) => ({
                ...prev,
                email: "Invalid email address.",
              }));
            } else if (err.response.data.message === "Invalid password") {
              setError((prev) => ({
                ...prev,
                password: "Invalid password.",
              }));
            } else {
              setError((prev) => ({
                ...prev,
                email:
                  "Invalid credentials. Please check your email and password.",
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
        <h1 className="text-3xl font-semibold">Login Page</h1>
        <p className="mt-4 mb-6">Enter your credentials to login.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full py-2 mt-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 relative"
          >
            {isLoading ? (
              <div className="spinner visible absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" role="status" aria-label="Loading"></div>
            ) : (
              "Login"
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
                  await handleGoogleSuccess(credentialResponse, login, navigate, false, showNotification);
                } catch (error) {
                  setGoogleError(error instanceof Error ? error.message : "Google login failed");
                  setIsLoading(false);
                }
              }}
              onError={() => {
                setGoogleError("Google login failed");
              }}
              theme="outline"
              size="large"
              width="100%"
              text="signin_with"
            />
            {googleError && (
              <p className="mt-2 text-red-500 text-sm">{googleError}</p>
            )}
          </div>
        </div>

        <p className="mt-4 text-gray-700">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Login;
