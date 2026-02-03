export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Blob 1 */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-surface/40 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      {/* Blob 2 */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-slate-800/40 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      {/* Blob 3 (Opcional, cor primária bem suave) */}
      <div className="absolute -bottom-8 left-20 w-[500px] h-[500px] bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
  );
}