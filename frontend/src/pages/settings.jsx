// --- This is the complete, final, and fully functional file for your Settings page. ---
import React, { useEffect, useState } from "react";
import { Moon, Sun, Monitor, KeyRound, User, Save } from "lucide-react";
// FIX: Corrected import paths to align with the project structure without file extensions.
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabaseClient";

// A reusable UI panel for organizing settings sections.
const Panel = ({ title, desc, children }) => (
  <div className="bg-gray-800/50 rounded-2xl border border-white/10 p-6">
    <div className="mb-4 border-b border-white/10 pb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
    {children}
  </div>
);

// A reusable component for displaying feedback messages (success or error).
const FeedbackMessage = ({ message, type }) => {
    if (!message) return null;
    const isError = type === 'error';
    return (
        <div className={`p-3 rounded-lg text-sm ${isError ? 'bg-red-900/40 text-red-300' : 'bg-green-900/40 text-green-300'}`}>
            {message}
        </div>
    );
};

export default function SettingsPage() {
  const { user } = useAuth(); // Get the live, authenticated user object.
  
  // State for the profile form
  const [fullName, setFullName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState({ message: '', type: '' });

  // State for the password change action
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState({ message: '', type: '' });
  
  // When the component loads, populate the form with the user's current name.
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  // --- ACTION HANDLERS ---

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileFeedback({ message: '', type: '' });

    // This function securely updates the user's metadata in Supabase.
    const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
    });

    if (error) {
        setProfileFeedback({ message: `Error: ${error.message}`, type: 'error' });
    } else {
        setProfileFeedback({ message: 'Profile updated successfully!', type: 'success' });
    }
    setIsSavingProfile(false);
  };

  const handleChangePassword = async () => {
    setIsSendingLink(true);
    setPasswordFeedback({ message: '', type: '' });

    // This is the recommended, secure way to handle password changes.
    // It sends a magic link to the user's verified email address.
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/`, // Redirect back to the dashboard after reset
    });

    if (error) {
        setPasswordFeedback({ message: `Error: ${error.message}`, type: 'error' });
    } else {
        setPasswordFeedback({ message: 'Password reset link sent to your email. Please check your inbox.', type: 'success' });
    }
    setIsSendingLink(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your profile, preferences, and security.</p>
      </div>

      {/* --- User Profile Panel --- */}
      <Panel title="User Profile" desc="This information will be displayed on your profile.">
        <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold">
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-400">Full Name</label>
                        <input
                            className="mt-1 w-full bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your full name"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-400">Email Address</label>
                        <input 
                            className="mt-1 w-full bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2 text-gray-500 cursor-not-allowed" 
                            value={user?.email || ''} 
                            readOnly 
                        />
                    </div>
                </div>
            </div>
             <div className="pt-2 flex items-center justify-between">
                <button type="submit" disabled={isSavingProfile} className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold flex items-center disabled:bg-gray-500">
                    <Save className="mr-2 h-4 w-4" />
                    {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </button>
                <div className="w-full max-w-sm">
                   <FeedbackMessage message={profileFeedback.message} type={profileFeedback.type} />
                </div>
            </div>
        </form>
      </Panel>

      {/* --- Security Panel --- */}
      <Panel title="Security" desc="Manage your password and account security.">
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg">
                <div>
                    <h3 className="font-semibold flex items-center"><KeyRound className="mr-2 h-5 w-5" /> Change Password</h3>
                    <p className="text-sm text-gray-400 mt-1">For security, we will send a reset link to your email.</p>
                </div>
                <button onClick={handleChangePassword} disabled={isSendingLink} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 font-semibold disabled:bg-gray-500">
                    {isSendingLink ? 'Sending...' : 'Send Link'}
                </button>
            </div>
             <FeedbackMessage message={passwordFeedback.message} type={passwordFeedback.type} />
        </div>
      </Panel>
      
       {/* --- Theme Preferences (Placeholder for Future) --- */}
      <Panel title="Preferences" desc="Customize the look and feel of your dashboard.">
         <div className="p-4 border border-dashed border-white/20 rounded-lg text-center">
            <p className="text-gray-400">Theme and language preferences will be available in a future update.</p>
         </div>
      </Panel>
    </div>
  );
}

