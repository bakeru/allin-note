export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <section className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="mb-6 rounded-full border border-white/15 px-4 py-1.5 text-sm font-medium text-white/70">
          Coming Soon
        </p>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
          AllIn Note
        </h1>
        <p className="mt-6 text-lg leading-8 text-white/70 sm:text-xl">
          AIが書いてくれる、教室のカルテと連絡ノート
        </p>
      </section>
    </main>
  );
}
