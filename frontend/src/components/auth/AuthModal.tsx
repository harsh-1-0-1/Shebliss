import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { APP_NAME } from '@/lib/branding';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, register, isLoading } = useAuthStore();
  const { fetchCart, mergeCart } = useCartStore();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  useBodyScrollLock(isAuthModalOpen);
  if (!isAuthModalOpen) return null;

  function reset() { setEmail(''); setPassword(''); setFullName(''); setPhone(''); }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const guest = localStorage.getItem('cart_session_id');
      await login(email, password);
      toast.success('Welcome back!');
      reset();
      if (guest) await mergeCart(guest); else await fetchCart();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Login failed');
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    try {
      const guest = localStorage.getItem('cart_session_id');
      await register(email, password, fullName, phone || undefined);
      toast.success('Account created!');
      reset();
      if (guest) await mergeCart(guest); else await fetchCart();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Registration failed');
    }
  }

  async function handleGoogle() {
    try {
      const { data } = await (await import('@/lib/api')).default.get('/auth/google');
      window.location.href = data.authorization_url;
    } catch { toast.error('Google login failed'); }
  }

  const inputCls = 'w-full px-4 py-3 border border-[#EFECE6] bg-white text-[14px] text-[#1A1A1A] placeholder:text-[#767676] focus:outline-none focus:border-[#C6A15E] transition-colors font-body';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={closeAuthModal} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
        <div
          className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto animate-slide-up sm:animate-fade-in"
          style={{ backgroundColor: '#F9F8F6' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button onClick={closeAuthModal} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#767676] hover:text-[#1A1A1A] transition-colors z-10">
            <X size={17} strokeWidth={1.5} />
          </button>

          <div className="p-7 sm:p-9">
            {/* Wordmark */}
            <div className="text-center mb-6">
              <p className="text-[12px] font-bold tracking-[0.28em] uppercase text-[#C6A15E] mb-1">{APP_NAME}</p>
              <h2 className="text-[1.8rem] text-[#1A1A1A] leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, letterSpacing: '0.02em' }}>
                {tab === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#EFECE6] mb-6">
              {(['login', 'register'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 pb-3 text-[12px] font-bold tracking-[0.14em] uppercase transition-colors relative ${
                    tab === t ? 'text-[#1A1A1A]' : 'text-[#767676] hover:text-[#1A1A1A]'
                  }`}
                >
                  {t === 'login' ? 'Sign In' : 'Register'}
                  {tab === t && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C6A15E]" />}
                </button>
              ))}
            </div>

            {/* Login form */}
            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <input type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
                <button type="submit" disabled={isLoading}
                  className="w-full py-3.5 bg-[#1A1A1A] text-[#F9F8F6] text-[12px] font-bold tracking-[0.16em] uppercase hover:bg-[#2B2421] transition-colors disabled:opacity-50 mt-2">
                  {isLoading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <input type="text" placeholder="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
                <input type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                <input type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
                <input type="password" placeholder="Password (min 8 chars)" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
                <button type="submit" disabled={isLoading}
                  className="w-full py-3.5 bg-[#1A1A1A] text-[#F9F8F6] text-[12px] font-bold tracking-[0.16em] uppercase hover:bg-[#2B2421] transition-colors disabled:opacity-50 mt-2">
                  {isLoading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-5 flex items-center">
              <div className="flex-1 border-t border-[#EFECE6]" />
              <span className="mx-4 text-[11px] text-[#767676] uppercase tracking-wider font-body">or</span>
              <div className="flex-1 border-t border-[#EFECE6]" />
            </div>

            {/* Google */}
            <button onClick={handleGoogle}
              className="w-full py-3 border border-[#EFECE6] text-[13px] font-medium text-[#2B2421] flex items-center justify-center gap-2.5 hover:border-[#C6A15E] hover:bg-[#EFECE6] transition-colors font-body">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
