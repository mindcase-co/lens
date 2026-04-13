import ReactMarkdown from "react-markdown";
import type { TextBlock as TextBlockType } from "@/types/config";

export function TextBlock({ config }: { config: TextBlockType }) {
  return (
    <div className="py-2">
      {config.title && <h3 className="text-base font-semibold text-foreground mb-2">{config.title}</h3>}
      <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
        <ReactMarkdown>{config.content}</ReactMarkdown>
      </div>
    </div>
  );
}
