import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface Category {
  id: string;
  name: string;
  count: number;
}

interface CategoryFilterProps {
  categories: Category[];
  selected: string[];
  onToggle: (categoryId: string) => void;
  onClear: () => void;
}

const categoryColors: Record<string, string> = {
  orchestration: '#3b82f6',
  memory: '#22c55e',
  cli: '#8b5cf6',
  integration: '#f59e0b',
  security: '#ef4444',
  performance: '#14b8a6',
};

export function CategoryFilter({
  categories,
  selected,
  onToggle,
  onClear,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {/* All button */}
      <motion.button
        className={clsx(
          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
          selected.length === 0
            ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
            : 'bg-bg-card text-gray-400 border border-white/10 hover:border-white/20'
        )}
        onClick={onClear}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        All
      </motion.button>

      {/* Category buttons */}
      {categories.map((category) => {
        const isSelected = selected.includes(category.id);
        const color = categoryColors[category.id] || '#3b82f6';

        return (
          <motion.button
            key={category.id}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
              isSelected
                ? 'text-white border'
                : 'bg-bg-card text-gray-400 border border-white/10 hover:border-white/20'
            )}
            style={
              isSelected
                ? {
                    backgroundColor: `${color}20`,
                    borderColor: `${color}50`,
                    color: color,
                  }
                : undefined
            }
            onClick={() => onToggle(category.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{category.name}</span>
            <span
              className={clsx(
                'px-1.5 py-0.5 text-xs rounded-full',
                isSelected ? 'bg-white/20' : 'bg-bg-dark'
              )}
            >
              {category.count}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
