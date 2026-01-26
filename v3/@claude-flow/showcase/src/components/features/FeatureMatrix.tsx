import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeatureCard } from './FeatureCard';
import { CategoryFilter } from './CategoryFilter';
import featuresData from '../../data/features.json';
import { staggerContainerVariants, staggerItemVariants } from '../../utils/animation-presets';
import type { Feature } from '../../types';

export function FeatureMatrix() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => {
    return featuresData.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      count: cat.features.length,
    }));
  }, []);

  const filteredFeatures = useMemo(() => {
    let features: (Feature & { categoryName: string })[] = [];

    featuresData.categories.forEach((category) => {
      if (selectedCategories.length === 0 || selectedCategories.includes(category.id)) {
        features = features.concat(
          category.features.map((f) => ({
            ...f,
            status: f.status as Feature['status'],
            categoryName: category.name,
          }))
        );
      }
    });

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      features = features.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query) ||
          f.relatedModules.some((m) => m.toLowerCase().includes(query))
      );
    }

    return features;
  }, [selectedCategories, searchQuery]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const statusCounts = useMemo(() => {
    const counts = { implemented: 0, 'in-progress': 0, planned: 0 };
    filteredFeatures.forEach((f) => {
      counts[f.status]++;
    });
    return counts;
  }, [filteredFeatures]);

  return (
    <motion.div
      className="p-4 h-full overflow-y-auto"
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Feature Matrix</h2>
          <p className="text-sm text-gray-400">
            Explore {filteredFeatures.length} features across {categories.length} categories
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 pl-10 pr-4 py-2 rounded-lg bg-bg-card border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>
      </div>

      {/* Category filters */}
      <CategoryFilter
        categories={categories}
        selected={selectedCategories}
        onToggle={toggleCategory}
        onClear={() => setSelectedCategories([])}
      />

      {/* Status summary */}
      <div className="flex items-center gap-4 mb-6">
        {[
          { status: 'implemented', label: 'Implemented', color: '#22c55e' },
          { status: 'in-progress', label: 'In Progress', color: '#f59e0b' },
          { status: 'planned', label: 'Planned', color: '#94a3b8' },
        ].map(({ status, label, color }) => (
          <div key={status} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-400">
              {label}: <span className="text-white">{statusCounts[status as keyof typeof statusCounts]}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Features grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={staggerContainerVariants}
      >
        <AnimatePresence mode="popLayout">
          {filteredFeatures.map((feature, index) => (
            <motion.div
              key={feature.id}
              variants={staggerItemVariants}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
            >
              <FeatureCard feature={feature} categoryName={feature.categoryName} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {filteredFeatures.length === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center py-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400">No features match your filters</p>
          <button
            onClick={() => {
              setSelectedCategories([]);
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 text-sm text-primary-400 hover:text-primary-300"
          >
            Clear filters
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
