export function InlineMd({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i} className="font-bold text-text-main">{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*"))
          return <em key={i} className="italic">{part.slice(1, -1)}</em>;
        if (part.startsWith("`") && part.endsWith("`"))
          return <code key={i} className="rounded bg-pill px-1 py-px font-mono text-[11px]">{part.slice(1, -1)}</code>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function MarkdownBlock({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  function flushList() {
    if (!listItems.length) return;
    nodes.push(
      <ul key={key++} className="my-0.5 mb-1 flex flex-col gap-0.5 pl-4">
        {listItems.map((item, i) => (
          <li key={i} className="text-xs leading-[1.6] text-text-mid"><InlineMd text={item} /></li>
        ))}
      </ul>
    );
    listItems = [];
  }

  for (const line of text.split("\n")) {
    if (line.startsWith("### ")) {
      flushList();
      nodes.push(<p key={key++} className="mb-px mt-2 text-xs font-bold text-text-main"><InlineMd text={line.slice(4)} /></p>);
    } else if (line.startsWith("## ")) {
      flushList();
      nodes.push(<p key={key++} className="mb-0.5 mt-2.5 text-[13px] font-bold text-text-main"><InlineMd text={line.slice(3)} /></p>);
    } else if (line.startsWith("# ")) {
      flushList();
      nodes.push(<p key={key++} className="mb-[3px] mt-3 text-sm font-extrabold text-text-main"><InlineMd text={line.slice(2)} /></p>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      nodes.push(<p key={key++} className="my-0.5 text-xs leading-[1.6] text-text-mid"><InlineMd text={line} /></p>);
    }
  }
  flushList();

  return <div className="flex flex-col gap-0">{nodes}</div>;
}
