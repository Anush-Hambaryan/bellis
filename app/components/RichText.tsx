export function RichText({
  text,
  className,
  italic = false,
  boldClassName = "text-highlight",
}: {
  text: string;
  className?: string;
  italic?: boolean;
  boldClassName?: string;
}) {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  const nodes = tokens.map((token, i) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={i} className={`font-bold ${boldClassName}`}>
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return <em key={i} className="italic opacity-80">{token.slice(1, -1)}</em>;
    }
    return token;
  });
  return (
    <p className={`${className ?? ""} m-0 ${italic ? "italic" : ""}`}>
      {nodes}
    </p>
  );
}
