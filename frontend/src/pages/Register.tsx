import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import axios, { AxiosError } from "axios";

const Register = () => {
  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    setError({ name: "", email: "", password: "" });
    setSuccessMessage("");

    let hasError = false;
    setIsLoading(true);

    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex: RegExp =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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
    } else if (!emailRegex.test(email)) {
      setError((prev) => ({
        ...prev,
        email: "Please enter a valid email address.",
      }));
      hasError = true;
    }

    if (!password) {
      setError((prev) => ({ ...prev, password: "Password is required." }));
      hasError = true;
    } else if (!passwordRegex.test(password)) {
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
        "http://localhost:5000/api/users",
        {
          name: name.trim(),
          email,
          password,
        }
      );

      setSuccessMessage("Registration successful! You can now login.");
      setName("");
      setEmail("");
      setPassword("");
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);

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
    <div className="flex justify-center items-center h-screen bg-gray-200">
      <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-3xl font-semibold">Register</h2>
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
            />
            {error.name && (
              <p className="text-red-500 text-sm">{error.name}</p>
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
            />
            {error.email && (
              <p className="text-red-500 text-sm">{error.email}</p>
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
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
            {error.password && (
              <p className="text-red-500 text-sm">{error.password}</p>
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

        <p className="mt-4 text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;