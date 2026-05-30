export default function NotFoundView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black font-serif px-6 select-none" id="error-404-scope">
      <style>{`
        /* Force clear high contrast background settings */
        html, body, #root {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
      `}</style>
      <div className="text-center max-w-lg">
        <h1 className="text-[40px] font-bold text-gray-950 font-sans tracking-tight mb-2">404 Not Found</h1>
        <div className="w-full border-t border-gray-300 my-4"></div>
        <p className="text-sm text-gray-500 font-sans italic tracking-wide">nginx</p>
      </div>
    </div>
  );
}
