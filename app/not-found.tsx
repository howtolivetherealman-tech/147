import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/20 text-red-500 font-black text-2xl mb-4">
          404
        </div>
        <h1 className="text-2xl font-extrabold mb-2">
          పేజీ కనుగొనబడలేదు (Page Not Found)
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          మీరు వెతుకుతున్న నేటి భారతం (NETI BHARATHAM) వార్తా పేజీ అందుబాటులో లేదు లేదా తరలించబడింది.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors"
        >
          హోమ్ పేజీకి వెళ్ళండి (Back to Home)
        </Link>
      </div>
    </main>
  );
}
