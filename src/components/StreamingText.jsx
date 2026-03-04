import { useEffect, useMemo, useState } from 'react';

export default function StreamingText({ text, enabled = true, stepMs = 40 }) {
  const words = useMemo(() => text.split(/(\s+)/), [text]);
  const [visibleCount, setVisibleCount] = useState(enabled ? 0 : words.length);

  useEffect(() => {
    setVisibleCount(enabled ? 0 : words.length);
  }, [text, enabled, words.length]);

  useEffect(() => {
    if (!enabled || visibleCount >= words.length) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setVisibleCount((count) => count + 1);
    }, stepMs);

    return () => clearTimeout(timer);
  }, [enabled, visibleCount, words.length, stepMs]);

  return <span>{enabled ? words.slice(0, visibleCount).join('') : text}</span>;
}
