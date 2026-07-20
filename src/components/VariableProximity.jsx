import { useEffect, useMemo, useRef, useState } from "react";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getFalloff = (distance, radius, type) => {
  const proximity = clamp(1 - distance / radius, 0, 1);

  if (type === "exponential") return proximity * proximity;
  if (type === "gaussian") return Math.exp(-Math.pow(distance / radius, 2) * 4);
  return proximity;
};

export default function VariableProximity({
  label,
  className = "",
  containerRef,
  radius = 120,
  falloff = "linear",
  fromFontVariationSettings = "'wght' 650, 'opsz' 16",
  toFontVariationSettings = "'wght' 1000, 'opsz' 42",
}) {
  const textRef = useRef(null);
  const [pointer, setPointer] = useState(null);
  const words = useMemo(() => label.split(" "), [label]);

  const parseSettings = (settings) =>
    Object.fromEntries(
      settings.split(",").map((item) => {
        const [axis, value] = item.trim().replaceAll("'", "").split(/\s+/);
        return [axis, Number(value)];
      })
    );

  const fromSettings = useMemo(
    () => parseSettings(fromFontVariationSettings),
    [fromFontVariationSettings]
  );
  const toSettings = useMemo(
    () => parseSettings(toFontVariationSettings),
    [toFontVariationSettings]
  );

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return undefined;

    let frameId = 0;

    const handleMove = (event) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setPointer({ x: event.clientX, y: event.clientY });
      });
    };

    const handleLeave = () => {
      cancelAnimationFrame(frameId);
      setPointer(null);
    };

    container.addEventListener("pointermove", handleMove);
    container.addEventListener("pointerleave", handleLeave);

    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener("pointermove", handleMove);
      container.removeEventListener("pointerleave", handleLeave);
    };
  }, [containerRef]);

  const getLetterStyle = (element) => {
    if (!pointer || !element) {
      return { fontVariationSettings: fromFontVariationSettings };
    }

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(pointer.x - centerX, pointer.y - centerY);
    const amount = getFalloff(distance, radius, falloff);

    const settings = Object.keys(fromSettings)
      .map((axis) => {
        const fromValue = fromSettings[axis];
        const toValue = toSettings[axis] ?? fromValue;
        const value = fromValue + (toValue - fromValue) * amount;
        return `'${axis}' ${Math.round(value)}`;
      })
      .join(", ");

    return {
      fontVariationSettings: settings,
      transform: `translateY(${-amount * 3}px)`,
    };
  };

  return (
    <span ref={textRef} className={className} aria-label={label}>
      {words.map((word, wordIndex) => (
        <span
          className="variable-proximity-word"
          aria-hidden="true"
          key={`${word}-${wordIndex}`}
        >
          {Array.from(word).map((letter, letterIndex) => {
            const index =
              words
                .slice(0, wordIndex)
                .reduce((count, item) => count + item.length, 0) + letterIndex;

            return (
              <span
                className="variable-proximity-letter"
                key={`${letter}-${wordIndex}-${letterIndex}`}
                style={getLetterStyle(
                  textRef.current?.querySelectorAll(
                    ".variable-proximity-letter"
                  )[index]
                )}
              >
                {letter}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}
