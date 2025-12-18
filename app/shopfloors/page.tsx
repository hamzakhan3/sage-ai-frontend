'use client';

import { ShopfloorsIcon, PlusIcon } from '@/components/Icons';

export default function ShopfloorsPage() {
  return (
    <div className="bg-dark-bg text-dark-text p-6 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShopfloorsIcon className="w-8 h-8 text-sage-400" />
            <h1 className="heading-inter heading-inter-lg">Equipments</h1>
          </div>
          <button
            className="bg-midnight-300 hover:bg-midnight-400 text-dark-text border border-dark-border p-2 rounded transition-colors flex items-center justify-center"
            title="Add Equipment"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="bg-dark-panel border border-dark-border rounded-lg p-8">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">Equipments list will be added here</p>
          <p className="text-sm">Content coming soon...</p>
        </div>
      </div>
    </div>
  );
}

