import { useState } from 'react';

const statusColors = {
  'UNPAID': 'bg-gray-500/20 text-gray-400',
  'AWAITING_SHIPMENT': 'bg-yellow-500/20 text-yellow-400',
  'AWAITING_COLLECTION': 'bg-orange-500/20 text-orange-400',
  'PARTIALLY_SHIPPING': 'bg-blue-500/20 text-blue-400',
  'IN_TRANSIT': 'bg-blue-500/20 text-blue-400',
  'DELIVERED': 'bg-green-500/20 text-green-400',
  'COMPLETED': 'bg-green-500/20 text-green-400',
  'CANCELLED': 'bg-red-500/20 text-red-400'
};

const statusLabels = {
  'UNPAID': 'Unpaid',
  'AWAITING_SHIPMENT': 'Awaiting Shipment',
  'AWAITING_COLLECTION': 'Awaiting Collection',
  'PARTIALLY_SHIPPING': 'Partially Shipping',
  'IN_TRANSIT': 'In Transit',
  'DELIVERED': 'Delivered',
  'COMPLETED': 'Completed',
  'CANCELLED': 'Cancelled'
};

export default function OrderTable({ orders, selectedOrders, onSelectOrder, onSelectAll, onShipOrder, onViewDetails }) {
  const allSelected = orders.length > 0 && selectedOrders.length === orders.length;
  const someSelected = selectedOrders.length > 0 && selectedOrders.length < orders.length;

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (amount, currency = 'MYR') => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => el && (el.indeterminate = someSelected)}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-600 border-gray-500 text-tiktok-pink focus:ring-tiktok-pink cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Order ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Address</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p>No orders found</p>
                    <p className="text-sm">Click "Fetch Orders" to load orders</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isSelected = selectedOrders.includes(order.id);
                const customer = order.recipient_address || {};

                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-700/30 transition-colors ${isSelected ? 'bg-tiktok-pink/10' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectOrder(order.id)}
                        className="w-4 h-4 rounded bg-gray-600 border-gray-500 text-tiktok-pink focus:ring-tiktok-pink cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-gray-300">
                        {order.id?.slice(-8) || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-white">
                        {customer.name || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-300">
                        {customer.phone_number || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <span className="text-sm text-gray-300 truncate block" title={customer.full_address}>
                        {customer.full_address || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-tiktok-cyan">
                        {formatPrice(order.payment?.total_amount, order.payment?.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-400">
                        {formatDate(order.create_time)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewDetails(order)}
                          className="text-tiktok-cyan hover:text-tiktok-pink transition-colors"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {order.status === 'AWAITING_SHIPMENT' && (
                          <button
                            onClick={() => onShipOrder(order)}
                            className="text-green-500 hover:text-green-400 transition-colors"
                            title="Ship Order"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
