import React from 'react';

interface MarkdownRendererProps {
    content: string;
    isChordsMode?: boolean;
    fontSize?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isChordsMode = false, fontSize = 'text-sm' }) => {
    if (!content) return null;

    // Function to detect if a line is primarily chords
    const isChordLine = (line: string): boolean => {
        if (!isChordsMode) return false;

        // Pattern for musical chords: C, Dm, G/B, F#m7, etc.
        const chordPattern = /\b[A-G][#b]?(m|maj|min|sus|add|dim|aug)?[0-9]*(\/[A-G][#b]?)?\b/g;
        const chords = line.match(chordPattern) || [];

        // Remove chords from line to see what's left
        const withoutChords = line.replace(chordPattern, '').trim();

        // If we found chords and what's left is mostly spaces/parentheses, it's a chord line
        const remainingContent = withoutChords.replace(/[\s\(\)]/g, '');

        return chords.length > 0 && remainingContent.length < 5;
    };

    // Regex patterns for markdown
    const patterns = [
        // Section headers: [Chorus], [Verse], etc. -> Dark badge style
        { regex: /\[(.*?)\]/g, style: 'section-header' },
        { regex: /\*\*__(.*?)__\*\*/g, style: 'bold-italic' },
        { regex: /\*\*(.*?)\*\*/g, style: 'bold' },
        { regex: /__(.*?)__/g, style: 'italic' },
        { regex: /_([^_]+)_/g, style: 'italic' },
        { regex: /\*([^*]+)\*/g, style: 'bold' }
    ];

    const renderText = (text: string) => {
        const elements: React.ReactNode[] = [];
        let currentIndex = 0;

        // Find all matches across the entire text
        const matches: Array<{ start: number; end: number; text: string; style: string }> = [];

        patterns.forEach(({ regex, style }) => {
            let match;
            const re = new RegExp(regex.source, 'g');
            while ((match = re.exec(text)) !== null) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[1],
                    style
                });
            }
        });

        // Sort matches by start position
        matches.sort((a, b) => a.start - b.start);

        // Remove overlapping matches (keep the first one)
        const cleanMatches = matches.filter((match, index) => {
            if (index === 0) return true;
            return match.start >= matches[index - 1].end;
        });

        cleanMatches.forEach((match, i) => {
            // Add text before the match
            if (currentIndex < match.start) {
                elements.push(
                    <span key={`text-${i}`}>
                        {text.substring(currentIndex, match.start)}
                    </span>
                );
            }

            // Add formatted text
            const key = `match-${i}`;
            if (match.style === 'bold') {
                elements.push(<strong key={key} className="font-bold">{match.text}</strong>);
            } else if (match.style === 'italic') {
                elements.push(<em key={key} className="italic">{match.text}</em>);
            } else if (match.style === 'bold-italic') {
                elements.push(<strong key={key} className="font-bold italic">{match.text}</strong>);
            } else if (match.style === 'section-header') {
                elements.push(
                    <span key={key} className="inline-block bg-black/40 text-[#ffef43] font-bold px-2 py-0.5 rounded text-xs uppercase tracking-wider my-1">
                        {match.text}
                    </span>
                );
            }

            currentIndex = match.end;
        });

        // Add remaining text
        if (currentIndex < text.length) {
            elements.push(
                <span key="text-end">
                    {text.substring(currentIndex)}
                </span>
            );
        }

        return elements.length > 0 ? elements : text;
    };

    // Split content into lines and render each with appropriate styling
    const lines = content.split('\n');

    return (
        <div className={`whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed font-mono ${fontSize}`}>
            {lines.map((line, index) => {
                const isChords = isChordLine(line);
                return (
                    <div key={index} className={isChords ? 'font-bold text-[#c89800]' : ''}>
                        {renderText(line)}
                        {index < lines.length - 1 && '\n'}
                    </div>
                );
            })}
        </div>
    );
};
