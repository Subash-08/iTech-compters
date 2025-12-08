import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { register, clearError } from '../../redux/actions/authActions';
import { toast } from 'react-toastify';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [avatar, setAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [verificationSent, setVerificationSent] = useState(false);

    const dispatch = useAppDispatch();
    const { loading, error, isAuthenticated } = useAppSelector((state) => state.authState);
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    useEffect(() => {
        const strength = calculatePasswordStrength(formData.password);
        setPasswordStrength(strength);
    }, [formData.password]);

    const calculatePasswordStrength = (password: string): number => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[@$!%*?&]/.test(password)) strength++;
        return strength;
    };

    const getPasswordStrengthColor = (strength: number): string => {
        if (strength <= 2) return 'bg-red-500';
        if (strength <= 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        
        if (error) {
            dispatch(clearError());
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file (JPEG, PNG, etc.)');
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Image size should be less than 2MB');
                return;
            }

            setAvatar(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeAvatar = () => {
        setAvatar(null);
        setAvatarPreview('');
    };

// In Register.tsx, update the handleSubmit function:
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
        dispatch(clearError());
        return;
    }

    if (formData.password.length < 8) {
        return;
    }

    const { confirmPassword, ...registerData } = formData;
    
    // Create FormData for file upload
    const submitData = new FormData();
    submitData.append('firstName', registerData.firstName);
    submitData.append('lastName', registerData.lastName);
    submitData.append('email', registerData.email);
    submitData.append('password', registerData.password);
    
    if (avatar) {
        submitData.append('avatar', avatar);
    }

    const result = await dispatch(register(submitData));
    
    if (result.success) {
        // ✅ AUTO-LOGIN: Redirect to home/dashboard instead of showing verification
        navigate('/', { replace: true });
        
        // Optional: Show success toast
        toast.success('Registration successful!');
    }
};


    // ✅ Show verification success message
    if (verificationSent) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-gray-900">Registration Successful!</h2>
                        <p className="mt-2 text-gray-600">
                            We've sent a verification email to your email address. 
                            Please check your inbox and click the verification link to activate your account.
                        </p>
                        <div className="mt-6 space-y-3">
                            <button
                                onClick={() => setVerificationSent(false)}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Register Another Account
                            </button>
                            <Link
                                to="/login"
                                className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Go to Login
                            </Link>
                        </div>
                        <p className="mt-4 text-sm text-gray-500">
                            Didn't receive the email?{' '}
                            <button className="text-blue-600 hover:text-blue-500">
                                Resend verification email
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <Link
                        to="/login"
                        className="font-medium text-blue-600 hover:text-blue-500"
                    >
                        sign in to your existing account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                    First Name *
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        autoComplete="given-name"
                                        required
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="First name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                    Last Name *
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        autoComplete="family-name"
                                        required
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="Last name"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address *
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password *
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
                                    placeholder="Create a password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="text-sm text-gray-500">
                                        {showPassword ? 'Hide' : 'Show'}
                                    </span>
                                </button>
                            </div>
                            
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex space-x-1">
                                        {[1, 2, 3, 4, 5].map((index) => (
                                            <div
                                                key={index}
                                                className={`h-1 flex-1 rounded-full ${
                                                    index <= passwordStrength 
                                                        ? getPasswordStrengthColor(passwordStrength) 
                                                        : 'bg-gray-200'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Password must contain uppercase, lowercase, number, and special character
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm Password *
                            </label>
                            <div className="mt-1">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Confirm your password"
                                />
                            </div>
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                            )}
                        </div>

                                                {/* Avatar Upload Section */}
                        <div className="text-center">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Profile Picture (Optional)
                            </label>
                            <div className="relative inline-block">
                                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300 mx-auto">
                                    {avatarPreview ? (
                                        <img 
                                            src={avatarPreview} 
                                            alt="Avatar preview" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    )}
                                </div>
                                
                                {/* Upload Button */}
                                <label htmlFor="avatar" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <input
                                        id="avatar"
                                        name="avatar"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </label>

                                {/* Remove Button (only show when avatar exists) */}
                                {avatarPreview && (
                                    <button
                                        type="button"
                                        onClick={removeAvatar}
                                        className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full cursor-pointer hover:bg-red-600 shadow-lg transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                JPEG, PNG, WEBP (Max 2MB)
                            </p>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                required
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                                I agree to the{' '}
                                <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                                    Terms and Conditions
                                </Link>
                            </label>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading || formData.password !== formData.confirmPassword || formData.password.length < 8}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Creating account...
                                    </div>
                                ) : (
                                    'Create account'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;