
export function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-white/20 mt-8">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo on the left */}
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">🐷</span>
            </div>
            <span className="ml-3 text-lg font-bold text-gray-800">Smart_Savings</span>
          </div>
          
          {/* Footer content on the right */}
          <div className="flex flex-col items-end text-right space-y-2">
            <h3 className="text-lg font-semibold text-slate-800">
              Lighthouse Media Cashbook
            </h3>
            <p className="text-sm text-slate-600">
              Created by Cyrus Maboshe
            </p>
            <p className="text-xs text-slate-500">
              © 2025 Lighthouse Media. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
