const milestoneItems = [
  "Open Windows desktop app",
  "Pick a local folder",
  "Validate Git repository",
  "Read current branch",
  "Detect uncommitted changes",
];

export default function App() {
  return (
    <main className="min-h-screen bg-zinc-950 px-8 py-10 text-zinc-100">
      <section className="mx-auto max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-zinc-500">
          Staged
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Local-first verification before commit.
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
          Milestone 1 focuses on the local verification spine: selecting a Git
          repository, reading its branch, and detecting uncommitted changes. No
          AI, no RAG, no cloud, no auto-fixing.
        </p>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <h2 className="text-lg font-medium">Milestone 1 target</h2>

          <ul className="mt-4 space-y-3">
            {milestoneItems.map((item) => (
              <li key={item} className="flex items-center gap-3 text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-zinc-500" />
                {item}
              </li>
            ))}
          </ul>

          <button
            type="button"
            disabled
            className="mt-6 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-500"
          >
            Repo picker coming next
          </button>
        </div>
      </section>
    </main>
  );
}