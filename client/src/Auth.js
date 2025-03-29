import React, { useState, useEffect, useCallback } from "react";
import { signInWithGoogle, signUpWithEmail, signInWithEmail } from "./firebase";
import { FaGoogle } from "react-icons/fa";

function AuthPage({ setUser }) {
  const API_URL = "https://letter-editor-backend-fh3x.onrender.com";
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  //  Check token expiration
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = JSON.parse(atob(token.split(".")[1])); // Decode JWT
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        setUser(null);
      } else {
        setUser({ token });
      }
    }
  }, [setUser]);

  //  Handle API Call for Authentication
  const authenticateUser = useCallback(async (user, method) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          token: user.token, // Pass token if available
        }),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        setUser(user);
      } else {
        setError(data.error || `${method} failed.`);
      }
    } catch (err) {
      setError(`${method} failed. Please try again.`);
    }
  }, [setUser]);

  //  Google Sign-In
  const handleGoogleLogin = async (e) => {
    e.preventDefault();
    try {
      const loggedInUser = await signInWithGoogle();
      localStorage.setItem("accessToken", loggedInUser.token);
      authenticateUser(loggedInUser.user, "Google sign-in");
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
    }
  };

  // Email Sign-Up
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const newUser = await signUpWithEmail(email, password);
      authenticateUser(newUser, "Sign-up");
    } catch (err) {
      setError(err.message || "Sign-up failed. Please try again.");
    }
  };

  //  Email Sign-In
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    try {
      const loggedInUser = await signInWithEmail(email, password);
      authenticateUser(loggedInUser, "Sign-in");
    } catch (err) {
      setError("Sign-in failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none"
                placeholder="Enter your password"
              />
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none"
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <div>
              <button
                type="submit"
                onClick={isSignUp ? handleEmailSignUp : handleEmailSignIn}
                className="w-full py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600"
              >
                {isSignUp ? "Sign Up" : "Sign In"}
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex align-center justify-center">
              <button
                onClick={handleGoogleLogin}
                className="w-2/3 flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-red-600 text-white hover:bg-red-500"
              >
                <FaGoogle className="mx-2" />
                Google
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button onClick={() => setIsSignUp(!isSignUp)} className="font-medium text-indigo-600 ml-1">
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
