import React, { useEffect, useState } from 'react';
import { RoyalChatMark } from '../common/RoyalChatMark';
import { RoyalChatButton } from '../common/RoyalChatButton';
import { Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { validateUsername } from '../../lib/username';

export const AuthFlow: React.FC = () => {
  const { authStep, setAuthStep, authLoading, authError, signUp, logIn } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Clear the form's own validation error whenever the user edits a
  // field again, or when the shared auth flow reports a fresh error.
  useEffect(() => {
    setFormError(null);
  }, [authStep]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address (Gmail, Outlook, Hotmail, or any provider).');
      return;
    }
    const usernameError = validateUsername(username);
    if (usernameError) {
      setFormError(usernameError);
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    try {
      await signUp({
        email: email.trim(),
        password,
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
      });
    } catch {
      // authError is already set by the context; nothing else to do.
    }
  };

  const handleLogIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError('Please enter your email and password.');
      return;
    }
    try {
      await logIn({ email: email.trim(), password });
    } catch {
      // authError is already set by the context; nothing else to do.
    }
  };

  const combinedError = formError || authError;

  // 1. Splash Screen
  if (authStep === 'splash') {
    return (
      <div className="flex flex-col items-center justify-between min-h-screen p-8 bg-[#F8F8F5] dark:bg-[#141B20] text-center select-none">
        <div className="w-full" />
        <div className="flex flex-col items-center max-w-sm">
          <RoyalChatMark size={84} />
          <h1 className="text-3xl font-extrabold tracking-tight text-[#202A30] dark:text-[#F4F5F2] mt-6">
            Royal Chat
          </h1>
          <p className="text-sm font-medium text-[#68747A] dark:text-[#ACB7BD] mt-2">
            Fast, free, real-time messaging.
          </p>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-black/5 dark:bg-white/10 rounded-full text-xs text-[#10B981] font-semibold mt-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Sign up with just an email — no phone number</span>
          </div>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <RoyalChatButton onClick={() => setAuthStep('signup')}>Create account</RoyalChatButton>
          <button
            onClick={() => setAuthStep('login')}
            className="w-full py-2.5 text-sm font-semibold text-[#F05D48] hover:underline"
          >
            I already have an account
          </button>
          <p className="text-[11px] text-[#8C9BA5]">
            By continuing, you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  // 2. Sign Up Screen — email + username + password only, no OTP.
  if (authStep === 'signup') {
    return (
      <div className="flex flex-col min-h-screen bg-[#F8F8F5] dark:bg-[#141B20] p-6 max-w-md mx-auto w-full select-none">
        <div className="flex-1">
          <div className="flex flex-col items-center mb-6">
            <RoyalChatMark size={52} />
          </div>
          <h2 className="text-2xl font-extrabold text-[#202A30] dark:text-[#F4F5F2] text-center">
            Create your account
          </h2>
          <p className="text-xs text-[#68747A] dark:text-[#ACB7BD] mt-2 mb-6 text-center">
            Free forever. Just an email, a username, and a password.
          </p>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#8C9BA5]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                autoComplete="email"
                className="w-full mt-1.5 p-3.5 bg-white dark:bg-[#202A30] border border-[#E2E7EC] dark:border-[#354148] rounded-xl text-sm font-medium outline-none focus:border-[#F05D48] text-[#202A30] dark:text-[#F4F5F2]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8C9BA5]">Username</label>
              <div className="flex items-center mt-1.5 bg-white dark:bg-[#202A30] border border-[#E2E7EC] dark:border-[#354148] rounded-xl px-3.5 focus-within:border-[#F05D48]">
                <span className="text-sm font-semibold text-[#8C9BA5] mr-1">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                  placeholder="yourusername"
                  autoComplete="off"
                  autoCapitalize="off"
                  className="w-full py-3.5 bg-transparent text-sm font-medium outline-none text-[#202A30] dark:text-[#F4F5F2]"
                  required
                />
              </div>
              <p className="text-[11px] text-[#8C9BA5] mt-1">
                People find and message you by this username — 3-20 characters, lowercase letters, numbers, underscore.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8C9BA5]">Full Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="What should people call you?"
                autoComplete="name"
                className="w-full mt-1.5 p-3.5 bg-white dark:bg-[#202A30] border border-[#E2E7EC] dark:border-[#354148] rounded-xl text-sm font-medium outline-none focus:border-[#F05D48] text-[#202A30] dark:text-[#F4F5F2]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8C9BA5]">Password</label>
              <div className="flex items-center mt-1.5 bg-white dark:bg-[#202A30] border border-[#E2E7EC] dark:border-[#354148] rounded-xl pr-3 focus-within:border-[#F05D48]">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className="w-full p-3.5 bg-transparent text-sm font-medium outline-none text-[#202A30] dark:text-[#F4F5F2]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-[#8C9BA5]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {combinedError && (
              <p className="text-xs font-medium text-red-500 bg-red-500/10 rounded-lg px-3 py-2">
                {combinedError}
              </p>
            )}

            <div className="pt-2">
              <RoyalChatButton type="submit" disabled={authLoading}>
                {authLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
                  </span>
                ) : (
                  'Create account'
                )}
              </RoyalChatButton>
            </div>

            <button
              type="button"
              onClick={() => setAuthStep('login')}
              className="w-full text-center text-xs font-semibold text-[#68747A] dark:text-[#ACB7BD] hover:text-[#F05D48] pt-1"
            >
              Already have an account? Log in
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. Log In Screen — email + password only.
  if (authStep === 'login') {
    return (
      <div className="flex flex-col min-h-screen bg-[#F8F8F5] dark:bg-[#141B20] p-6 max-w-md mx-auto w-full select-none">
        <div className="flex-1">
          <div className="flex flex-col items-center mb-6">
            <RoyalChatMark size={52} />
          </div>
          <h2 className="text-2xl font-extrabold text-[#202A30] dark:text-[#F4F5F2] text-center">
            Welcome back
          </h2>
          <p className="text-xs text-[#68747A] dark:text-[#ACB7BD] mt-2 mb-6 text-center">
            Log in with your email and password.
          </p>

          <form onSubmit={handleLogIn} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#8C9BA5]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                autoComplete="email"
                className="w-full mt-1.5 p-3.5 bg-white dark:bg-[#202A30] border border-[#E2E7EC] dark:border-[#354148] rounded-xl text-sm font-medium outline-none focus:border-[#F05D48] text-[#202A30] dark:text-[#F4F5F2]"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8C9BA5]">Password</label>
              <div className="flex items-center mt-1.5 bg-white dark:bg-[#202A30] border border-[#E2E7EC] dark:border-[#354148] rounded-xl pr-3 focus-within:border-[#F05D48]">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="w-full p-3.5 bg-transparent text-sm font-medium outline-none text-[#202A30] dark:text-[#F4F5F2]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-[#8C9BA5]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {combinedError && (
              <p className="text-xs font-medium text-red-500 bg-red-500/10 rounded-lg px-3 py-2">
                {combinedError}
              </p>
            )}

            <div className="pt-2">
              <RoyalChatButton type="submit" disabled={authLoading}>
                {authLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Logging in...
                  </span>
                ) : (
                  'Log in'
                )}
              </RoyalChatButton>
            </div>

            <button
              type="button"
              onClick={() => setAuthStep('signup')}
              className="w-full text-center text-xs font-semibold text-[#68747A] dark:text-[#ACB7BD] hover:text-[#F05D48] pt-1"
            >
              Don't have an account? Create one
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};
