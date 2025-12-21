import { useState } from 'react';

export default function FilterBar({ onFilter, onRefresh, loading }) {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const filterParams = {};

    if (filters.startDate) {
      filterParams.create_time_ge = Math.floor(new Date(filters.startDate).getTime() / 1000);
    }

    if (filters.endDate) {
      // Add one day to include the end date fully
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      filterParams.create_time_lt = Math.floor(endDate.getTime() / 1000);
    }

    if (filters.status) {
      filterParams.order_status = filters.status;
    }

    onFilter(filterParams);
  };

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleChange}
            className="input-field w-auto"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleChange}
            className="input-field w-auto"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Status
          </label>
          <select
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="input-field w-auto min-w-[180px]"
          >
            <option value="">All Status</option>
            <option value="UNPAID">Unpaid</option>
            <option value="AWAITING_SHIPMENT">Awaiting Shipment</option>
            <option value="AWAITING_COLLECTION">Awaiting Collection</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Orders'}
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="btn-secondary disabled:opacity-50"
        >
          Refresh
        </button>
      </form>
    </div>
  );
}
