import React, { useState, useEffect } from 'react';
import { RelayMark } from '../common/RelayMark';
import { RelayButton } from '../common/RelayButton';
import { RelayAvatar } from '../common/RelayAvatar';
import { ArrowLeft, ShieldCheck, ChevronDown, Check, Camera } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const COUNTRIES = [
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
];

export const AuthFlow: React.FC = () => {
  const { authStep, setAuthStep, currentUser, updateProfile, showToast } = useApp();

  // Phone state
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneInput, setPhoneInput] = useState('1711234567');
  const [countrySearch, setCountrySearch] = useState('');

  // OTP state
  const [otpCode, setOtpCode] = useState(['5', '2', '8', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(30);

  // Profile setup state
  const [profileName, setProfileName] = useState(currentUser.displayName || 'Navid');
  const [profileAbout, setProfileAbout] = useState(
    currentUser.about || 'Available on Relay'
  );

  // Countdown timer for OTP
  useEffect(() => {
    let timer: number | null = null;
    if (authStep === 'otp' && resendCountdown > 0) {
      timer = window.setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [authStep, resendCountdown]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneInput.trim().length < 6) {
      showToast('Please enter a valid phone number', 'info');
      return;
    }
    setResendCountdown(30);
    setAuthStep('otp');
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const updated = [...otpCode];
    updated[index] = val;
    setOtpCode(updated);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthStep('profile');
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('Please enter your name', 'info');
      return;
    }
    updateProfile({
      displayName: profileName.trim(),
      about: profileAbout.trim(),
      phoneNumber: `${selectedCountry.code} ${phoneInput.trim()}`,
    });
    setAuthStep('complete');
    showToast('Welcome to Relay!', 'check');
  };

  // 1. Splash Screen
  if (authStep === 'splash') {
    return (
      <div className="flex flex-col items-center justify-between min-h-screen p-8 bg-[#F8F8F5] dark:bg-[#141B20] text-center select-none">
        <div className="w-full" />
        <div className="flex flex-col items-center max-w-sm">
          <RelayMark size={84} />
          <h1 className="text-3xl font-extrabold tracking-tight text-[#202A30] dark:text-[#F4F5F2] mt-6">
            Relay
          </h1>
          <p className="text-sm font-medium text-[#68747A] dark:text-[#ACB7BD] mt-2">
            Fast, private messaging.
          </p>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-black/5 dark:bg-white/10 rounded-full text-xs text-[#10B981] font-semibold mt-4">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero-Knowledge E2EE</span>
          </div>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <RelayButton onClick={() => setAuthStep('phone')}>
            Get Started
          </RelayButton>
          <p className="text-[11px] text-[#8C9BA5]">
            By tapping Get Started, you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>
    );
  }

  // 2. Phone Entry Screen
  if (authStep === 'phone') {
    return (
      <div className="flex flex-col min-h-screen bg-[#F8F8F5] dark:bg-[#141B20] p-6 max-w-md mx-auto w-full select-none">
        <div className="flex items-center gap-3 pt-2 mb-8">
          <button
            onClick={() => setAuthStep('splash')}
            className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#68747A]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-[#8C9BA5]">Step 1 of 3</span>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-extrabold text-[#202A30] dark:text-[#F4F5F2]">
            What’s your phone number?
          </h2>
          <p className="text-xs text-[#68747A] dark:text-[#ACB7BD] mt-2 mb-6">
            Relay will send a verification SMS code. Carrier fees may apply.
          </p>

          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            {/* Country code selector button */}
            <div
              onClick={() => setShowCountryPicker(true)}
              className="flex items-center justify-between p-3.5 bg-white dark:bg-[#202A30] border border-[#E2E7EC] dark:border-[#354148] rounded-xl cursor-pointer hover:border-[#F05D48]"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
                  {selectedCountry.name} ({selectedCountry.code})
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-[#8C9BA5]" />
            </div>

            {/* Phone input */}
            <div className="flex items-center bg-white dark:bg-[#202A30] border border-[#E2E7EC] dark:border-[#354148] rounded-xl px-4 py-3 focus-within:border-[#F05D48]">
              <span className="font-mono text-sm font-semibold text-[#68747A] mr-2">
                {selectedCountry.code}
              </span>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Phone number"
                className="w-full bg-transparent text-base font-semibold text-[#202A30] dark:text-[#F4F5F2] outline-none"
                autoFocus
              />
            </div>

            <div className="pt-6">
              <RelayButton type="submit">Continue</RelayButton>
            </div>
          </form>
        </div>

        {/* Country Picker Modal */}
        {showCountryPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#202A30] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#E2E7EC] dark:border-[#354148]">
              <h3 className="font-bold text-base text-[#202A30] dark:text-[#F4F5F2] mb-3">
                Select Country
              </h3>
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search countries..."
                className="w-full p-2.5 bg-stone-50 dark:bg-[#182026] border border-[#E2E7EC] dark:border-[#354148] rounded-xl text-xs mb-3 outline-none"
              />
              <div className="max-h-64 overflow-y-auto divide-y divide-[#E2E7EC] dark:divide-[#354148]">
                {COUNTRIES.filter((c) =>
                  c.name.toLowerCase().includes(countrySearch.toLowerCase())
                ).map((c) => (
                  <div
                    key={c.name}
                    onClick={() => {
                      setSelectedCountry(c);
                      setShowCountryPicker(false);
                    }}
                    className="flex items-center justify-between py-3 px-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span>{c.flag}</span>
                      <span className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
                        {c.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[#8C9BA5]">
                      {c.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. OTP Verification Screen
  if (authStep === 'otp') {
    return (
      <div className="flex flex-col min-h-screen bg-[#F8F8F5] dark:bg-[#141B20] p-6 max-w-md mx-auto w-full select-none">
        <div className="flex items-center gap-3 pt-2 mb-8">
          <button
            onClick={() => setAuthStep('phone')}
            className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#68747A]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-[#8C9BA5]">Step 2 of 3</span>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-extrabold text-[#202A30] dark:text-[#F4F5F2]">
            Enter 6-digit code
          </h2>
          <p className="text-xs text-[#68747A] dark:text-[#ACB7BD] mt-2 mb-6">
            Enter the code sent to {selectedCountry.code} {phoneInput}.
          </p>

          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="flex justify-between gap-2">
              {otpCode.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-12 h-14 text-center font-mono text-xl font-bold bg-white dark:bg-[#202A30] border border-[#E2E7EC] dark:border-[#354148] rounded-xl focus:border-[#F05D48] outline-none text-[#202A30] dark:text-[#F4F5F2]"
                />
              ))}
            </div>

            <div className="text-center text-xs text-[#68747A] dark:text-[#ACB7BD]">
              {resendCountdown > 0 ? (
                <span>Resend code in {resendCountdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setResendCountdown(30)}
                  className="text-[#F05D48] font-bold hover:underline"
                >
                  Resend code
                </button>
              )}
            </div>

            <div className="pt-4">
              <RelayButton type="submit">Verify & Proceed</RelayButton>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 4. Profile Setup Screen
  if (authStep === 'profile') {
    return (
      <div className="flex flex-col min-h-screen bg-[#F8F8F5] dark:bg-[#141B20] p-6 max-w-md mx-auto w-full select-none">
        <div className="pt-2 mb-8">
          <span className="text-sm font-bold text-[#8C9BA5]">Step 3 of 3</span>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-extrabold text-[#202A30] dark:text-[#F4F5F2]">
            Set up your profile
          </h2>
          <p className="text-xs text-[#68747A] dark:text-[#ACB7BD] mt-2 mb-6">
            This name and about status will be visible to your Relay contacts.
          </p>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Avatar picker simulation */}
            <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer">
                <RelayAvatar name={profileName || 'User'} size={88} />
                <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6" />
                </div>
              </div>
              <span className="text-xs font-semibold text-[#F05D48] mt-2">
                Change photo
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8C9BA5]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full mt-1.5 p-3.5 bg-white dark:bg-[#202A30] border border-[#E2E7EC] dark:border-[#354148] rounded-xl text-sm font-semibold outline-none focus:border-[#F05D48] text-[#202A30] dark:text-[#F4F5F2]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8C9BA5]">
                  About Status
                </label>
                <input
                  type="text"
                  value={profileAbout}
                  onChange={(e) => setProfileAbout(e.target.value)}
                  placeholder="What’s on your mind?"
                  className="w-full mt-1.5 p-3.5 bg-white dark:bg-[#202A30] border border-[#E2E7EC] dark:border-[#354148] rounded-xl text-sm outline-none focus:border-[#F05D48] text-[#202A30] dark:text-[#F4F5F2]"
                />
              </div>
            </div>

            <div className="pt-6">
              <RelayButton type="submit">Complete Registration</RelayButton>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
};
