import React from 'react';
import Note from '@tonaljs/note';

interface MarkdownRendererProps {
    content: string;
    isChordsMode?: boolean;
    fontSize?: string;
    transposeSteps?: number;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isChordsMode = false, fontSize = 'text-sm', transposeSteps = 0 }) => {
    if (!content) return null;

    // Function to transpose a single chord using TonalJS
    const transposeChord = (chord: string, steps: number): string => {
        if (steps === 0) return chord;

        try {
            // Extract the root note (e.g., "C" from "Cm7", "F#" from "F#m")
            const match = chord.match(/^([A-G][#b]?)(.*)$/);
            if (!match) return chord;

            const [, root, suffix] = match;

            // Map semitone steps to TonalJS intervals
            // Positive steps (Sharp direction, but we want Flats for result usually)
            const intervals = [
                '1P', '2m', '2M', '3m', '3M', '4P', '4A', '5P', '6m', '6M', '7m', '7M'
            ];

            const absSteps = Math.abs(steps);
            const semitones = absSteps % 12;

            let interval = intervals[semitones];

            // If going down (negative steps)
            if (steps < 0) {
                // To go down X semitones, we can go up (12-X) semitones or use negative intervals
                // TonalJS handles negative intervals like '-2m'
                interval = '-' + interval;
            }

            const transposedRoot = Note.transpose(root, interval);

            // If transpose failed, return original
            if (!transposedRoot) return chord;

            // Robust enharmonic simplification
            // Converts theoretical notes (Fb, Bbb) to practical notes (E, A)
            // and enforces Flat notation for black keys.
            const simplifyEnharmonic = (note: string) => {
                const map: Record<string, string> = {
                    // White key aliases
                    'Fb': 'E', 'Cb': 'B', 'E#': 'F', 'B#': 'C',
                    // Double flats
                    'Bbb': 'A', 'Abb': 'G', 'Gbb': 'F', 'Fbb': 'Eb', 'Ebb': 'D', 'Dbb': 'C', 'Cbb': 'Bb',
                    // Double sharps
                    'C##': 'D', 'D##': 'E', 'F##': 'G', 'G##': 'A', 'A##': 'B',
                    // Sharp to Flat conversion
                    'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
                };
                return map[note] || note;
            };

            return simplifyEnharmonic(transposedRoot) + suffix;
        } catch (error) {
            console.error('Error transposing chord:', chord, error);
            return chord;
        }
    };

    // Function to transpose all chords in a line
    const transposeChordLine = (line: string, steps: number): string => {
        if (steps === 0) return line;

        // Pattern for musical chords: C, Dm, G/B, F#m7, etc.
        const chordPattern = /\b([A-G][#b]?(m|maj|min|sus|add|dim|aug)?[0-9]*(\/[A-G][#b]?)?)\b/g;

        return line.replace(chordPattern, (match) => transposeChord(match, steps));
    };

    // Function to detect if a line is primarily chords
    const isChordLine = (line: string): boolean => {
        if (!isChordsMode) return false;

        // Remove bracketed tags like [Solo], [Coro], [Verse] first
        const lineWithoutTags = line.replace(/\[.*?\]/g, '').trim();

        // If nothing left after removing tags, it's not a chord line
        if (!lineWithoutTags) return false;

        // Pattern for musical chords: C, Dm, G/B, F#m7, etc.
        const chordPattern = /\b[A-G][#b]?(m|maj|min|sus|add|dim|aug)?[0-9]*(\/[A-G][#b]?)?\b/g;
        const chords = lineWithoutTags.match(chordPattern) || [];

        // Remove chords from line to see what's left
        const withoutChords = lineWithoutTags.replace(chordPattern, '').trim();

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
        { regex: /\*([^*]+)\*/g, style: 'bold' },
        { regex: /\{(.*?)\}/g, style: 'singer-tag' }
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
            } else if (match.style === 'singer-tag') {
                elements.push(
                    <span key={key} className="inline-block bg-black/40 text-[#6ee7b3] font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider my-1 leading-tight">
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
                // Apply transpose to chord lines
                const processedLine = isChords ? transposeChordLine(line, transposeSteps) : line;
                return (
                    <div key={index} className={isChords ? `font-bold ${transposeSteps !== 0 ? 'text-[#4ade80]' : 'text-[#c89800]'}` : ''}>
                        {renderText(processedLine)}
                        {index < lines.length - 1 && '\n'}
                    </div>
                );
            })}
        </div>
    );
};
