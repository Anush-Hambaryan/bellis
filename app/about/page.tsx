import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FlashcardQualitySection } from "../analytics/FlashcardQualitySection";
import { UserThumbsSection } from "../analytics/UserThumbsSection";
import { VectorSection } from "../analytics/VectorSection";

export const metadata: Metadata = {
  title: "About Bellis",
  description:
    "About Bellis, an AI-powered English learning assistant that uses retrieval-augmented generation (RAG) for personalized learning.",
};

const flashcardFeatures = [
  "Clear, level-appropriate definitions",
  "Example sentences",
  "Memory and retention tips",
  "Visual cues through reference images",
  "Useful facts and contextual information",
  "Connections to previously learned concepts",
];

const learnerLevels = [
  {
    level: "Beginner",
    body: "Uses simpler vocabulary, shorter explanations, and familiar examples to make new ideas easier to follow.",
  },
  {
    level: "Intermediate",
    body: "Adds more natural phrasing, practical usage context, and examples that support growing fluency.",
  },
  {
    level: "Advanced",
    body: "Uses more precise vocabulary, complex grammar structures, and finer distinctions between meanings.",
  },
];

const stackSections = [
  {
    title: "App",
    body: "Bellis is built with Next.js and Tailwind CSS for a modern, responsive experience optimized for speed and accessibility. Clerk handles user authentication and account management across devices.",
  },
  {
    title: "AI Orchestration",
    body: "LangGraph coordinates the complete learning workflow, allowing Bellis to choose the right tools and learning strategy for each request.",
  },
  {
    title: "RAG, Memory, and Personalization",
    body: "MongoDB stores flashcards and learning data. Chroma stores learner-scoped vector embeddings and powers similarity search across each learner's vocabulary.",
  },
  {
    title: "Quality and Evaluation",
    body: "Langfuse captures traces, user feedback, evaluation metrics, and quality scores so the learning experience can keep improving.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-page font-sans text-text-main">
      <header className="px-3 pt-3 sm:px-4 lg:px-5">
        <div className="about-reveal mx-auto flex h-16 w-full max-w-[calc(100vw-2.5rem)] items-center justify-between gap-5 rounded-[20px] border border-black/[0.07] bg-card px-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:px-5">
          <Link href="/about" className="flex min-w-0 items-center gap-3">
            <Image src="/icon.svg" alt="" width={36} height={36} className="rounded-[10px]" priority />
            <div className="min-w-0">
              <p className="text-base font-extrabold leading-tight text-text-main">Bellis</p>
              <p className="text-xs font-semibold leading-tight text-text-light">English learning assistant</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-bold text-text-mid md:flex">
            <a href="#overview" className="transition hover:text-text-main">Overview</a>
            <a href="#architecture" className="transition hover:text-text-main">Architecture</a>
            <a href="#evaluation" className="transition hover:text-text-main">Evaluation</a>
          </nav>

          <Link
            href="/sign-in"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-[12px] bg-accent px-4 text-sm font-bold text-white shadow-button transition active:scale-[0.98]"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="px-3 pt-8 pb-4 sm:px-4 lg:px-5">
        <div className="mx-auto flex w-full max-w-[calc(100vw-2.5rem)] flex-col gap-8">
          <section
            id="overview"
            className="about-reveal grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]"
            style={{ animationDelay: "80ms" }}
          >
            <div className="rounded-[18px] border border-pill bg-card p-6 shadow-card sm:p-8 lg:p-10">
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent">
                  AI-powered English learning
                </span>
                <span className="rounded-full bg-content px-3 py-1.5 text-xs font-bold text-text-mid">
                  Adaptive flashcards
                </span>
                <span className="rounded-full bg-content px-3 py-1.5 text-xs font-bold text-text-mid">
                  Retrieval-augmented generation (RAG)
                </span>
              </div>

              <h1 className="text-4xl font-[820] leading-none tracking-normal text-text-main sm:text-5xl lg:text-[62px]">
                About Bellis
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-text-mid">
                Bellis is an AI-powered English learning assistant designed to make language
                learning more personalized and effective.
              </p>
              <p className="mt-4 max-w-3xl text-base leading-7 text-text-mid">
                Unlike traditional search tools, Bellis adapts to each learner&apos;s proficiency
                level and existing knowledge. Learners can ask vocabulary, grammar, usage,
                pronunciation, and language nuance questions, then receive explanations shaped
                for their current level.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/sign-in"
                  className="inline-flex h-11 items-center justify-center rounded-[12px] bg-accent px-5 text-sm font-bold text-white shadow-button transition active:scale-[0.98]"
                >
                  Start learning
                </Link>
                <a
                  href="#architecture"
                  className="inline-flex h-11 items-center justify-center rounded-[12px] border border-pill bg-card px-5 text-sm font-bold text-text-main transition hover:bg-content active:scale-[0.98]"
                >
                  View architecture
                </a>
                <a
                  href="https://github.com/Anush-Hambaryan/bellis"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-pill bg-card px-5 text-sm font-bold text-text-main transition hover:bg-content active:scale-[0.98]"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                  >
                    <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.24c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.28-5.27-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.75 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.71 5.38-5.29 5.67.42.36.79 1.06.79 2.14v3.18c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
                  </svg>
                  View on GitHub
                </a>
              </div>
            </div>

            <div className="rounded-[18px] bg-text-main p-6 text-white shadow-card sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/60">
                Learner fit
              </p>
              <div className="mt-6 grid gap-4">
                {learnerLevels.map((item) => (
                  <article key={item.level} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                    <h2 className="text-base font-bold text-white">{item.level}</h2>
                    <p className="mt-1 text-sm leading-6 text-white/68">{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="about-reveal rounded-[18px] border border-pill bg-card p-6 shadow-card sm:p-8" style={{ animationDelay: "150ms" }}>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-accent">
                  Rich flashcards
                </p>
                <h2 className="mt-2 text-3xl font-[780] leading-tight text-text-main">
                  Word lookups become durable study material.
                </h2>
                <p className="mt-3 text-base leading-7 text-text-mid">
                  When Bellis detects that a learner is looking up a specific word, it
                  automatically generates a rich learning flashcard that can be saved to a
                  personal deck for future review.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {flashcardFeatures.map((feature, index) => (
                  <article key={feature} className="rounded-[14px] bg-content p-4">
                    <p className="text-xs font-extrabold text-accent">{String(index + 1).padStart(2, "0")}</p>
                    <p className="mt-2 text-sm font-bold leading-6 text-text-main">{feature}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="architecture" className="about-reveal" style={{ animationDelay: "220ms" }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-accent">
                Technical Architecture
              </p>
              <h2 className="mt-2 text-3xl font-[780] leading-tight text-text-main">
                A learning workflow built around retrieval, memory, and quality.
              </h2>
              <p className="mt-3 text-base leading-7 text-text-mid">
                Bellis combines a modern learner interface, AI orchestration, structured
                storage, and evaluation tooling with retrieval-augmented generation (RAG).
                Semantic search retrieves relevant words from the learner&apos;s history, giving
                the model personalized context for connecting new vocabulary to prior learning.
              </p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {stackSections.map((section) => (
                <article key={section.title} className="rounded-[18px] border border-pill bg-card p-6 shadow-card sm:p-7">
                  <h3 className="text-xl font-[780] leading-tight text-text-main">
                    {section.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-text-mid">{section.body}</p>
                </article>
              ))}
            </div>

            <div className="mt-5">
              <VectorSection allUsers />
            </div>
          </section>

          <section id="evaluation" className="about-reveal" style={{ animationDelay: "290ms" }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-accent">
                Quality and Evaluation
              </p>
              <h2 className="mt-2 text-3xl font-[780] leading-tight text-text-main">
                Bellis keeps a visible quality loop.
              </h2>
              <p className="mt-3 text-base leading-7 text-text-mid">
                Quality is continuously monitored through Langfuse, which captures traces,
                feedback, metrics, and scores. Bellis also uses an LLM-as-judge evaluation
                flow to review generated flashcards. These signals help identify areas for
                improvement and keep explanations, flashcards, and learning experiences
                accurate, helpful, and aligned with learner needs.
              </p>

            </div>

            <div className="mt-5 grid items-start gap-4 lg:grid-cols-2">
              <FlashcardQualitySection allUsers />
              <UserThumbsSection allUsers />
            </div>
          </section>

        </div>
      </main>

      <footer className="px-3 pb-3 sm:px-4 lg:px-5">
        <div className="about-reveal mx-auto flex w-full max-w-[calc(100vw-2.5rem)] flex-col gap-5 rounded-[20px] border border-black/[0.07] bg-card px-5 py-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between" style={{ animationDelay: "390ms" }}>
          <div className="flex items-center gap-3">
            <Image src="/icon.svg" alt="" width={32} height={32} className="rounded-[9px]" />
            <div>
              <p className="text-sm font-extrabold text-text-main">Bellis</p>
              <p className="text-xs leading-5 text-text-light">Personalized English learning with organized semantic memory.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-bold text-text-mid">
            <a href="#overview" className="transition hover:text-text-main">Overview</a>
            <a href="#architecture" className="transition hover:text-text-main">Architecture</a>
            <a href="#evaluation" className="transition hover:text-text-main">Evaluation</a>
            <Link href="/sign-in" className="text-accent transition hover:text-text-main">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
