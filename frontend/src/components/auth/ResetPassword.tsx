// src/components/auth/ResetPassword.tsx - COMPLETE FIX
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { baseURL } from '../config/config';

const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState<boolean | null>(null);
    const [passwordStrength, setPasswordStrength] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    // Create public axios instance with NO credentials
    const publicApi = axios.create({
        baseURL: import.meta.env.VITE_API_URL || baseURL,
        timeout: 15000,
        withCredentials: false, // ⚠️ CRITICAL: Set to FALSE to not send cookies
        headers: {
            'Content-Type': 'application/json',
        },
    });

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setTokenValid(false);
                toast.error('Invalid reset link - missing token');
                return;
            }

            try {
                const response = await publicApi.get(`/password/reset/verify?token=${token}`);
                setTokenValid(true);
            } catch (error: any) {
                console.error('Token verification failed:', error.response?.data);
                setTokenValid(false);
                
                if (error.response?.status === 400) {
                    const errorMsg = error.response?.data?.message || 'Invalid or expired reset token';
                    toast.error(errorMsg);
                } else {
                    toast.error('Invalid reset link');
                }
            }
        };

        verifyToken();
    }, [token]);

    const checkPasswordStrength = (pwd: string) => {
        if (pwd.length === 0) return '';
        if (pwd.length < 6) return 'Weak - At least 6 characters';
        
        const hasUpperCase = /[A-Z]/.test(pwd);
        const hasLowerCase = /[a-z]/.test(pwd);
        const hasNumbers = /\d/.test(pwd);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
        
        const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecial].filter(Boolean).length;
        
        switch (strength) {
            case 1: return 'Weak';
            case 2: return 'Fair';
            case 3: return 'Good';
            case 4: return 'Strong';
            default: return 'Weak';
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordStrength(checkPasswordStrength(newPassword));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (tokenValid === false) {
            toast.error('Invalid or expired reset link');
            navigate('/forgot-password');
            return;
        }

        if (!token) {
            toast.error('Reset token is missing');
            return;
        }

        // Validation
        if (!password.trim() || !confirmPassword.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            const response = await publicApi.put('/password/reset', {
                token,
                password
            });
            if (response.data.success) {
                setSuccess(true);
                toast.success(response.data.message || 'Password reset successfully!');
                
                // Auto-redirect after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                toast.error(response.data.message || 'Failed to reset password');
            }
        } catch (error: any) {
            console.error('Reset password error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
                headers: error.config?.headers,
                url: error.config?.url
            });
            
            const errorMessage = error.response?.data?.message || error.message || 'Network error';
            
            if (error.response?.status === 401) {
                // Clear cookies and try again
                document.cookie.split(";").forEach((c) => {
                    document.cookie = c
                        .replace(/^ +/, "")
                        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
                
                toast.error('Authentication issue. Please clear browser cookies and try again.');
            } else if (error.response?.status === 400) {
                if (errorMessage.includes('active')) {
                    toast.error('A reset link was already sent. Please check your email.');
                } else {
                    toast.error('Invalid or expired reset token');
                    setTokenValid(false);
                    navigate('/forgot-password');
                }
            } else {
                toast.error(errorMessage || 'Failed to reset password');
            }
        } finally {
            setLoading(false);
        }
    };

    // Show loading while verifying token
    if (tokenValid === null) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                        <p className="mt-4 text-gray-600">Verifying reset link...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">Invalid Reset Link</h3>
                        <p className="mt-2 text-sm text-gray-600">This password reset link is invalid or has expired.</p>
                        <div className="mt-6 space-y-3">
                            <button onClick={() => navigate('/forgot-password')} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Request New Reset Link
                            </button>
                            <button onClick={() => navigate('/login')} className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Return to Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Set New Password</h2>
                <p className="mt-2 text-center text-sm text-gray-600">Create a new password for your account</p>
                {tokenValid && <p className="mt-1 text-center text-xs text-green-600">✓ Reset link verified</p>}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {success ? (
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="mt-4 text-lg font-medium text-gray-900">Password Reset Successfully!</h3>
                            <p className="mt-2 text-sm text-gray-600">Your password has been updated successfully.</p>
                            <p className="mt-2 text-sm text-gray-500">Redirecting to login page...</p>
                            <button onClick={() => navigate('/login')} className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Go to Login Now
                            </button>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    New Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={password}
                                        onChange={handlePasswordChange}
                                        disabled={loading}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                                        placeholder="Enter new password"
                                    />
                                </div>
                                {passwordStrength && (
                                    <p className={`mt-1 text-xs ${
                                        passwordStrength.includes('Weak') ? 'text-red-600' :
                                        passwordStrength.includes('Fair') ? 'text-yellow-600' :
                                        passwordStrength.includes('Good') ? 'text-blue-600' : 'text-green-600'
                                    }`}>
                                        Password strength: {passwordStrength}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirm New Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                                {password && confirmPassword && password !== confirmPassword && (
                                    <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                                )}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading || password !== confirmPassword || password.length < 6}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {loading ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Resetting password...
                                        </div>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                
                {/* Debug info */}
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                    <p className="font-medium">Debug Info:</p>
                    <p>Token present: {token ? 'Yes' : 'No'}</p>
                    <p>Token valid: {tokenValid ? 'Yes' : 'No'}</p>
                    <p>Using public API: Yes</p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;