"use client";

import React from "react";

function isValidEmail(value: string): boolean {
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  return emailRegex.test(value) && value.length <= 254 && value.length >= 6;
}

async function subscribeToNewsletter(email: string) {
  try {
    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error("Failed to subscribe");
    }

    return await response.json();
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    throw error;
  }
}

function Registration() {
  const [value, setValue] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState("");
  
  const hasTypedAt = value.includes("@");
  const isValid = hasTypedAt && isValidEmail(value);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const suffixRef = React.useRef<HTMLSpanElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value.toLowerCase());
      setMessage("");
    },
    []
  );

  const handleSubmit = React.useCallback(async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      await subscribeToNewsletter(value);
      setMessage("Successfully subscribed!");
      setValue("");
    } catch (error) {
      setMessage("Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [value, isValid, isSubmitting]);

  React.useLayoutEffect(() => {
    const input = inputRef.current;
    const suffix = suffixRef.current;
    if (!input || !suffix || hasTypedAt) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.font = window.getComputedStyle(input).font;
    ctx.letterSpacing = "-0.03em";
    const textWidth = ctx.measureText(value).width;
    const inputRect = input.getBoundingClientRect();
    const halfHeight = inputRect.height / 2;

    suffix.style.left = `${textWidth}px`;
    suffix.style.top = `${halfHeight}px`;
    suffix.style.transform = "translateY(-50%)";
  }, [value, hasTypedAt]);

  return (
    <div className="space-y-2">
      <div className="flex-1 min-w-0 h-8 relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="absolute text-sm inset-0 w-full h-full px-0 border-b-[0.5px] border-black/40 font-vremena bg-transparent outline-none appearance-none transition-colors text-black placeholder-transparent overflow-x-auto tracking-[-0.03em] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar-track]:hidden selection:bg-transparent focus:border-b-black focus:border-b-[0.75px]"
          maxLength={64}
          autoComplete="off"
          spellCheck="false"
          disabled={isSubmitting}
        />
        <span
          ref={suffixRef}
          className="absolute text-sm font-vremena text-black/40 pointer-events-none user-select-none whitespace-nowrap z-10 tracking-[-0.015em]"
          style={{ display: hasTypedAt ? "none" : "block" }}
          aria-hidden
        >
          @
        </span>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={`absolute right-1 bottom-2 text-[10px] transition-opacity pointer-events-auto z-20 whitespace-nowrap hover:cursor-pointer ${
            isValid && !isSubmitting
              ? "opacity-100"
              : "opacity-40 cursor-default"
          }`}
        >
          {isSubmitting ? "..." : "REGISTER"}
        </button>
      </div>
      {message && (
        <p className={`text-xs ${message.includes("Success") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export { Registration };
