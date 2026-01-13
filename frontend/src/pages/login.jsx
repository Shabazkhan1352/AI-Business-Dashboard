// NEW FILE: This component provides the user interface for logging in.
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            // On successful login, Supabase's onAuthStateChange will trigger
            // and the user will be redirected by the Layout component.
            router.push('/dashboard'); // Redirect to dashboard after login
        } catch (err) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
            <div className="w-full max-w-sm p-8 space-y-8 bg-[#121722] rounded-2xl border border-white/10">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-blue-500 p-3 rounded-lg">
                            <LayoutDashboard className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold">AI Business Dashboard</h1>
                    <p className="text-gray-400 mt-2">Please sign in to continue</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-500"
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
