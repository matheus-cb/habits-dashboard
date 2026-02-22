import { useState } from 'react';

export default function SocialLoginButtons() {
  const [toastVisible, setToastVisible] = useState(false);

  function showToast() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  return (
    <div className="relative">
      {toastVisible && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg whitespace-nowrap z-10 animate-fade-in">
          Em breve 🚀
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mt-4">
        {/* Google */}
        <button
          type="button"
          onClick={showToast}
          className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 px-3 hover:bg-gray-50 transition-colors"
          aria-label="Continuar com Google"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          <span className="text-sm text-gray-700 font-medium hidden sm:block">Google</span>
        </button>

        {/* GitHub */}
        <button
          type="button"
          onClick={showToast}
          className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 px-3 hover:bg-gray-50 transition-colors"
          aria-label="Continuar com GitHub"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"
              fill="#24292e"
            />
          </svg>
          <span className="text-sm text-gray-700 font-medium hidden sm:block">GitHub</span>
        </button>

        {/* Apple */}
        <button
          type="button"
          onClick={showToast}
          className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 px-3 hover:bg-gray-50 transition-colors"
          aria-label="Continuar com Apple"
        >
          <svg width="16" height="18" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-38.8-155.8-103.2C46.3 761.1 0 656.6 0 556.2 0 348.6 109.7 238.6 217.6 238.6c61.3 0 112.6 40.2 150.7 40.2 36.4 0 93.5-42.7 162.7-42.7 28.5 0 130.7 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"
              fill="#24292e"
            />
          </svg>
          <span className="text-sm text-gray-700 font-medium hidden sm:block">Apple</span>
        </button>
      </div>
    </div>
  );
}
