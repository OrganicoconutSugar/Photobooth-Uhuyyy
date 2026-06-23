import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function CornerLeaf({ className }) {
  return (
    <svg className={`absolute w-8 h-8 text-sage-400/60 ${className}`} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M4 28 Q4 16 12 8 Q20 4 28 4" strokeLinecap="round" />
      <path d="M4 28 Q8 28 12 24" strokeLinecap="round" />
      <path d="M28 4 Q24 8 24 12" strokeLinecap="round" />
    </svg>
  );
}

function CornerStem({ className }) {
  return (
    <svg className={`absolute w-6 h-6 text-sage-300/50 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 20 L20 4" strokeLinecap="round" />
      <path d="M4 20 C4 14 8 10 12 8" strokeLinecap="round" />
      <circle cx="4" cy="20" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="20" cy="4" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function OrnamentBorder({ children }) {
  return (
    <div className="ornament-border relative">
      <CornerLeaf className="-top-3 -left-3 rotate-0" />
      <CornerStem className="-top-3 -right-3 rotate-90" />
      {children}
      <div className="ornament-border-bl" />
      <div className="ornament-border-br" />
      <CornerStem className="-bottom-3 -left-3 -rotate-90" />
      <CornerLeaf className="-bottom-3 -right-3 rotate-180" />
    </div>
  );
}

function InputField({ label, type, value, onChange, placeholder, autoComplete }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-sage-700 tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-5 py-3.5 bg-white border-2 border-sage-200 rounded-lg text-sm text-sage-800 placeholder-sage-300/70 outline-none transition-all duration-200 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20"
      />
    </div>
  );
}

function SubmitButton({ children, loading }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-4 bg-sage-500 hover:bg-sage-600 disabled:bg-sage-300 text-white font-semibold rounded-lg tracking-wider transition-all duration-200 hover:shadow-lg hover:shadow-sage-500/25 active:scale-[0.98] disabled:cursor-not-allowed text-sm"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Memproses...
        </span>
      ) : children}
    </button>
  );
}

function ModeToggle({ text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-sage-600 hover:text-sage-800 underline underline-offset-4 decoration-sage-300 hover:decoration-sage-500 transition-all"
    >
      {text}
    </button>
  );
}

function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
    setForgotSuccess('');
  }

  function switchMode(newMode) {
    resetForm();
    setMode(newMode);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setError('');
    setForgotSuccess('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim email');
      setForgotSuccess(data.message || 'Email reset password telah dikirim');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md w-full self-center my-auto animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sage-800 tracking-tight">Photobooth</h1>
          <p className="text-xs text-sage-500 mt-1.5 tracking-widest">Est. 2025</p>
        </div>

        <OrnamentBorder>
          <div className="bg-white/90 backdrop-blur-sm p-10 rounded-lg">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-sage-800 tracking-tight">
                {mode === 'login' && 'Masuk'}
                {mode === 'register' && 'Buat Akun'}
                {mode === 'forgot' && 'Lupa Password'}
              </h2>
              <p className="text-xs text-sage-500 mt-1.5 tracking-wider">
                {mode === 'login' && 'Selamat datang kembali'}
                {mode === 'register' && 'Bergabung dengan kami'}
                {mode === 'forgot' && 'Tenang, kami bantu'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 text-center">
                {error}
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-6 p-4 bg-sage-50 border border-sage-200 rounded-lg text-xs text-sage-700 text-center">
                {forgotSuccess}
              </div>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgot}>
              <div className="space-y-5">
                {mode === 'register' && (
                  <InputField
                    label="Nama pengguna"
                    type="text"
                    value={username}
                    onChange={setUsername}
                    placeholder="Nama pengguna"
                    autoComplete="username"
                  />
                )}

                <InputField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="contoh@email.com"
                  autoComplete={mode === 'login' ? 'email' : 'email'}
                />

                {mode !== 'forgot' && (
                  <InputField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                )}
              </div>

              <div className="mt-8 space-y-5">
                <SubmitButton loading={submitting}>
                  {mode === 'login' && 'Masuk'}
                  {mode === 'register' && 'Daftar'}
                  {mode === 'forgot' && 'Kirim'}
                </SubmitButton>

                <div className="flex flex-col items-center gap-3">
                  {mode === 'login' && (
                    <>
                      <ModeToggle text="Lupa password?" onClick={() => switchMode('forgot')} />
                      <ModeToggle text="Buat Akun" onClick={() => switchMode('register')} />
                    </>
                  )}
                  {mode === 'register' && (
                    <ModeToggle text="Sudah punya akun? Login" onClick={() => switchMode('login')} />
                  )}
                  {mode === 'forgot' && (
                    <ModeToggle text="Kembali ke login" onClick={() => switchMode('login')} />
                  )}
                </div>
              </div>
            </form>
          </div>
        </OrnamentBorder>

        <p className="text-xs text-sage-400 text-center mt-8 tracking-wider">
          &copy; {new Date().getFullYear()} Photobooth &mdash; Semua hak dilindungi
        </p>
      </div>
  );
}

export default Login;
