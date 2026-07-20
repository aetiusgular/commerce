/**
 * Vertical spacer.
 *
 * The height is resolved through an explicit lookup rather than interpolated
 * into the class name. Tailwind extracts class names statically, so a template
 * literal like `h-${height}` never makes it into the emitted stylesheet and
 * silently produces zero spacing.
 */
const heights: Record<string, string> = {
  "1": "h-1",
  "2": "h-2",
  "3": "h-3",
  "4": "h-4",
  "6": "h-6",
  "8": "h-8",
  "10": "h-10",
  "12": "h-12",
  "16": "h-16",
};

function Division({ height }: { height: string }) {
  return <div className={`w-full ${heights[height] ?? "h-4"}`} />;
}

export { Division };
