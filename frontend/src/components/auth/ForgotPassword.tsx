// src/components/auth/ForgotPassword.tsx - Update to use publicApi
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios'; // Add this import
import { baseURL } from '../config/config';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    // Create public axios instance
    const publicApi = axios.create({
        baseURL: import.meta.env.VITE_API_URL || baseURL,
        timeout: 15000,
        withCredentials: false, // Don't send cookies
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email.trim()) {
            toast.error('Please enter your email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            // Use publicApi for forgot password
            const response = await publicApi.post('/password/forgot', { email });
            
            if (response.data.success) {
                setSuccess(true);
                toast.success(response.data.message || 'Password reset email sent successfully!');
                
                setTimeout(() => {
                    navigate('/login');
                }, 5000);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Network error';
            
            if (error.response?.status === 404) {
                toast.error('No account found with this email address');
            } else if (error.response?.status === 400) {
                toast.error('Password reset not available for Google login users. Please use Google Sign-In.');
            } else {
                toast.error(errorMessage || 'Failed to process your request');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignInRedirect = () => {
        // Clear the form
        setEmail('');
        setSuccess(false);
        
        // Navigate to login page with Google sign-in
        navigate('/login', { 
            state: { 
                showGoogleSignIn: true,
                email: email // Pass email for convenience
            } 
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Reset Your Password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <Link
                        to="/login"
                        className="font-medium text-blue-600 hover:text-blue-500"
                    >
                        return to sign in
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {success ? (
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <svg 
                                    className="h-6 w-6 text-green-600" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth="2" 
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            
                            <h3 className="mt-4 text-lg font-medium text-gray-900">
                                Check Your Email
                            </h3>
                            
                            <p className="mt-2 text-sm text-gray-600">
                                We've sent password reset instructions to <strong>{email}</strong>
                            </p>
                            
                            <p className="mt-2 text-sm text-gray-500">
                                Please check your inbox and follow the instructions to reset your password.
                            </p>
                            
                            <div className="mt-6 space-y-4">
                                <div className="text-sm">
                                    <span className="text-gray-500">Didn't receive the email? </span>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="font-medium text-blue-600 hover:text-blue-500"
                                    >
                                        {loading ? 'Resending...' : 'Resend email'}
                                    </button>
                                </div>
                                
                                <div className="text-sm">
                                    <span className="text-gray-500">Make sure to check your spam folder.</span>
                                </div>
                                
                                <div className="pt-4">
                                    <p className="text-sm text-gray-500">
                                        You will be redirected to the login page in 5 seconds...
                                    </p>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="mt-3 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Go to Login Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <p className="text-sm text-gray-600">
                                    Enter your email address and we'll send you a link to reset your password.
                                </p>
                            </div>

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email address
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={loading}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            placeholder="Enter your email address"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        {loading ? (
                                            <div className="flex items-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Sending reset link...
                                            </div>
                                        ) : (
                                            'Send Reset Link'
                                        )}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-6">
                                <div className="text-sm text-center">
                                    <Link
                                        to="/register"
                                        className="font-medium text-blue-600 hover:text-blue-500"
                                    >
                                        Don't have an account? Sign up
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Help Section */}
                <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Need help?</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Ensure you're entering the email associated with your account</li>
                        <li>• Check your spam/junk folder for the reset email</li>
                        <li>• If you used Google to sign up, use the Google button above</li>
                        <li>• Contact support if you continue to have issues</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;