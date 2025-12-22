import { useState } from 'react';

export default function FilterBar({ onFetch, onFilterChange, loading, statusOptions = [] }) {
  const [fetchDate, setFetchDate] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });

  const handleFilterChange = (e) => {
    const newFilters = {
      ...filters,
      [e.target.name]: e.target.value
    };
    setFilters(newFilters);

    // Notify parent of filter changes for client-side filtering
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleFetch = (e) => {
    e.preventDefault();

    if (!fetchDate) {
      alert('Please select a date to fetch orders');
      return;
    }

    const fetchParams = {
      create_time_ge: Math.floor(new Date(fetchDate).getTime() / 1000),
      // Fetch for the entire day
      create_time_lt: Math.floor(new Date(fetchDate).getTime() / 1000) + 86400
    };

    onFetch(fetchParams);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleFetch} className="space-y-6">
        {/* Fetch Section */}
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Fetch Orders from TikTok API</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fetch Date
              </label>
              <input
                type="date"
                value={fetchDate}
                onChange={(e) => setFetchDate(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? 'Fetching...' : 'Fetch Orders'}
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter Displayed Orders</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-auto min-w-[180px] px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
