"use client";

import { useEffect, useState } from "react";

import { MOTIVATION_QUOTES } from "../lib/quotes";

const QUOTE_KEY = "gestor-login-quote-index";

export function MotivationQuote() {
  const [quoteIndex, setQuoteIndex] = useState<number | null>(null);

  useEffect(() => {
    const savedIndex = Number(window.localStorage.getItem(QUOTE_KEY));
    if (Number.isInteger(savedIndex) && MOTIVATION_QUOTES[savedIndex]) {
      setQuoteIndex(savedIndex);
      return;
    }

    setQuoteIndex(new Date().getDate() % MOTIVATION_QUOTES.length);
  }, []);

  const quote = MOTIVATION_QUOTES[quoteIndex ?? 0];

  return (
    <div className="card quoteCard secGap">
      <p className="quoteText">{quote.text}</p>
      <p className="quoteAuthor">- {quote.author}</p>
    </div>
  );
}

export function storeNextLoginQuote() {
  const previousIndex = Number(window.localStorage.getItem(QUOTE_KEY));
  const availableIndexes = MOTIVATION_QUOTES.map((_, index) => index).filter(
    (index) => index !== previousIndex
  );
  const nextIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)] ?? 0;
  window.localStorage.setItem(QUOTE_KEY, String(nextIndex));
}
