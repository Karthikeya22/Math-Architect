import React, { useState } from 'react';
import { dbService } from '../services/dbService';
import { User } from '../types';
import { GraduationCap, ArrowRight, UserPlus, LogIn, Lock } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<Props> = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    try {
      let user: User;
      if (isLoginMode) {
        user = dbService.login(username);
      } else {
        if (!fullName.trim()) {
          setError('Full Name is required');
          return;
        }
        user = dbService.register(username, fullName);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center text-white">
          <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Florida Math Architect</h1>
          <p className="text-blue-100 text-sm">AI-Powered Educational Platform</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="mb-6 flex gap-4 bg-slate-50 p-1 rounded-xl">
             <button 
               onClick={() => { setIsLoginMode(true); setError(''); }}
               className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isLoginMode ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
             >
               Login
             </button>
             <button 
               onClick={() => { setIsLoginMode(false); setError(''); }}
               className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isLoginMode ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
             >
               Register
             </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
               <input 
                 type="text" 
                 value={username}
                 onChange={e => setUsername(e.target.value)}
                 className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium"
                 placeholder="Enter your username"
               />
            </div>

            {!isLoginMode && (
              <div className="animate-slide-down">
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                 <input 
                   type="text" 
                   value={fullName}
                   onChange={e => setFullName(e.target.value)}
                   className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium"
                   placeholder="Enter your full name"
                 />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                 <Lock className="w-4 h-4" />
                 {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLoginMode ? (
                 <> <LogIn className="w-4 h-4" /> Login to Dashboard </>
              ) : (
                 <> <UserPlus className="w-4 h-4" /> Create Account </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
               Secure Database Connection • Local Persistence
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;