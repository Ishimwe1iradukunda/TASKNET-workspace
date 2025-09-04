import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const renderMarkdown = (text: string) => {
    // A simple and safe markdown to HTML converter for chat messages.
    // Supports: **bold**, *italic*, `inline code`, ```code blocks```, and [links](url).

    // 1. Escape HTML to prevent XSS
    let escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Process code blocks first to prevent further markdown processing inside them
    const codeBlocks: string[] = [];
    escapedText = escapedText.replace(/```([\s\S]*?)```/g, (match, code) => {
      codeBlocks.push(`<pre class="bg-muted p-2 rounded-md my-1 text-sm overflow-x-auto"><code>${code.trim()}</code></pre>`);
      return `__CODEBLOCK_${codeBlocks.length - 1}__`;
    });

    // 3. Process other markdown elements
    let html = escapedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>') // Inline code
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'); // Links

    // 4. Restore code blocks
    html = html.replace(/__CODEBLOCK_(\d+)__/g, (match, index) => codeBlocks[parseInt(index, 10)]);

    // 5. Handle newlines by wrapping lines in paragraphs
    return html.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '<br>').join('');
  };

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none prose-p:m-0 prose-pre:m-0 prose-strong:text-inherit prose-em:text-inherit prose-code:text-inherit"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}
