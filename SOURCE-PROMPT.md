I will give you a list of video shorts containing:

- A title
- A start timestamp
- An end timestamp
- Sometimes a timestamp like "--01:00:00" appears between groups.

Your job is to convert the entire list into this exact TypeScript format:

export const shorts: { from: number; to: number; title: string }[] = [
  {
    from: 6000,
    to: 6110,
    title: 'Jesus age além do que o homem pode fazer',
  },
  {
    from: 6475,
    to: 6540,
    title: 'Confie em Deus pois ele não abandona os seus filhos',
  },
];

IMPORTANT TIMESTAMP RULES:

1. Convert EVERY timestamp to total seconds.

2. Normal timestamps are interpreted as:
   MM:SS
   or
   HH:MM:SS

   Examples:
   21:00 = 1260 seconds
   22:30 = 1350 seconds
   01:40:00 = 6000 seconds
   01:41:50 = 6110 seconds

3. The most important rule:
   When you see a timestamp beginning with "--", such as:

   --01:00:00

   this means that EVERYTHING AFTER THAT MARKER belongs to a new hour/block and must have the marker's time ADDED to its timestamps.

   Example:

   --01:00:00

   Ninguém nasce sabendo coisas sobre casamento
   00:10
   01:30

   The actual timestamps are:

   01:00:10 = 3610 seconds
   01:01:30 = 3690 seconds

   Therefore:

   {
     from: 3610,
     to: 3690,
     title: 'Ninguém nasce sabendo coisas sobre casamento',
   }

4. The offset marker may be any valid timestamp, not only 01:00:00.

   For example:

   --02:30:00

   followed by:

   10:00
   12:00

   means:

   02:40:00
   02:42:00

   Therefore the values must be calculated using the offset.

5. Once an offset marker appears, keep applying that offset to ALL subsequent timestamps until another offset marker appears.

6. If there is no offset marker, interpret the timestamps normally.

7. Do NOT reset the time to zero after an offset marker. The timestamps in the final array must represent the REAL position in the complete video.

8. Preserve the order of the shorts exactly as provided.

9. Keep every short. Do not accidentally omit, merge, duplicate, or reorder entries.

10. Fix obvious spelling, capitalization, punctuation, and grammatical errors in the titles while preserving their original meaning.

11. Use Portuguese titles if the source is Portuguese.

12. Use single quotes around titles.

13. Add a useful comment showing the original timestamp next to each `from` and `to` value when practical. For timestamps after an offset, show the FULL resulting timestamp.

14. Before giving the final answer, manually verify EVERY conversion from timestamp → seconds.

15. Pay special attention to timestamps around hour boundaries and overlapping shorts. Do NOT assume shorts must be non-overlapping; preserve the supplied times exactly.

16. The final answer must contain ONLY the TypeScript array. No explanation, no introduction, no Markdown explanation.

INPUT:
I will now provide the list. Process it according to ALL the rules above.