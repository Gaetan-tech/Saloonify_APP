interface StarRatingProps {
  note: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (note: number) => void;
}

export default function StarRating({ note, max = 5, size = 'md', interactive = false, onChange }: StarRatingProps) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' };

  return (
    <div className={`flex items-center gap-0.5 ${sizes[size]}`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i + 1 <= note;
        const half = !filled && i + 0.5 <= note;
        return (
          <button
            key={i}
            type="button"
            onClick={interactive && onChange ? () => onChange(i + 1) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
              filled ? 'text-yellow-400' : half ? 'text-yellow-300' : 'text-gray-300'
            }`}
            aria-label={interactive ? `${i + 1} étoile${i > 0 ? 's' : ''}` : undefined}
          >
            {filled ? '★' : half ? '⯨' : '☆'}
          </button>
        );
      })}
      {!interactive && (
        <span className="ml-1 text-gray-600 font-medium text-sm">{note.toFixed(1)}</span>
      )}
    </div>
  );
}
