import { formatPrice } from '@/lib/utils/price';

interface PriceDisplayProps {
  currentPrice: number;
  originalPrice?: number | null;
  discountPercent?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showDiscount?: boolean;
}

export default function PriceDisplay({
  currentPrice,
  originalPrice,
  discountPercent,
  size = 'md',
  showDiscount = true,
}: PriceDisplayProps) {
  const sizeClasses = {
    sm: { current: 'text-lg', original: 'text-sm', discount: 'text-xs px-1.5 py-0.5' },
    md: { current: 'text-2xl', original: 'text-base', discount: 'text-sm px-2 py-1' },
    lg: { current: 'text-4xl', original: 'text-xl', discount: 'text-base px-3 py-1.5' },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-bold text-red-600 ${classes.current}`}>
        {formatPrice(currentPrice)}
      </span>

      {originalPrice && originalPrice > currentPrice && (
        <span className={`text-gray-400 line-through ${classes.original}`}>
          {formatPrice(originalPrice)}
        </span>
      )}

      {showDiscount && discountPercent && discountPercent > 0 && (
        <span
          className={`rounded-full bg-red-100 font-medium text-red-600 ${classes.discount}`}
        >
          -{discountPercent}%
        </span>
      )}
    </div>
  );
}
