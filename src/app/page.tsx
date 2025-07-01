"use client";
import { useState, useEffect } from "react";

type Character = {
  name: string;
  faction: string;
  rank: string;
  traits: string[];
  dialogue: string[];
};

export default function Home() {
  const [chars, setChars] = useState<Character[]>([]);
  const [isRunning, setRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    if (chars.length >= 5) {
      setRunning(false);
      return;
    }
    (async () => {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ currentCount: chars.length }),
      });
      if (res.ok) {
        const { character } = await res.json();
        setChars((prev) => [...prev, character]);
      } else {
        console.error(await res.json());
      }
    })();
  }, [chars, isRunning]);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Character Auto-Generator ({chars.length}/5)
      </h1>

      <button
        className="rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-40"
        onClick={() => setRunning(true)}
        disabled={isRunning || chars.length >= 5}
      >
        {isRunning ? "Generating..." : "Start"}
      </button>

      <ul className="mt-6 space-y-4">
        {chars.map((c, i) => (
          <li key={i} className="border p-4 rounded">
            <h2 className="font-semibold">
              {c.name} &mdash; {c.rank} ({c.faction})
            </h2>
            <p className="italic">Traits: {c.traits.join(", ")}</p>
            <details>
              <summary className="cursor-pointer">Dialogues</summary>
              <ul className="list-disc ml-6">
                {c.dialogue.map((d, idx) => <li key={idx}>{d}</li>)}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </main>
  );
}
