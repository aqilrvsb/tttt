const statusColors = {
  'UNPAID': 'bg-gray-100 text-gray-800',
  'AWAITING_SHIPMENT': 'bg-yellow-100 text-yellow-800',
  'AWAITING_COLLECTION': 'bg-orange-100 text-orange-800',
  'PARTIALLY_SHIPPING': 'bg-blue-100 text-blue-800',
  'IN_TRANSIT': 'bg-blue-100 text-blue-800',
  'DELIVERED': 'bg-green-100 text-green-800',
  'COMPLETED': 'bg-green-100 text-green-800',
  'CANCELLED': 'bg-red-100 text-red-800'
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

export default function OrderTable({ orders, selectedOrders, onSelectOrder, onSelectAll, onShipOrder, onViewDetails, onUpdateDetails }) {
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="border-b">
            <tr className="border-b transition-colors hover:bg-gray-50/50">
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                #
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => el && (el.indeterminate = someSelected)}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">Order ID</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">Customer</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">Phone</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">Address</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">Update Details</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">Amount</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">Status</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">Date</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="11" className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">No orders found</p>
                      <p className="text-sm text-gray-500 mt-1">Click "Fetch Orders" to load orders</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order, index) => {
                const isSelected = selectedOrders.includes(order.id);
                const customer = order.recipient_address || {};

                return (
                  <tr
                    key={order.id}
                    className={`border-b transition-colors hover:bg-gray-50/50 ${isSelected ? 'bg-primary-50' : ''}`}
                  >
                    <td className="p-4 align-middle text-gray-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="p-4 align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectOrder(order.id)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 align-middle">
                      <span className="font-mono text-gray-900 font-medium">
                        {order.id?.slice(-8) || '-'}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="text-gray-900 font-medium">
                        {customer.name || '-'}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="text-gray-700">
                        {customer.phone_number || '-'}
                      </span>
                    </td>
                    <td className="p-4 align-middle max-w-xs">
                      <span className="text-gray-700 truncate block" title={customer.full_address}>
                        {customer.full_address || '-'}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <textarea
                        className="w-48 h-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        placeholder="Paste customer details here..."
                        defaultValue={order.manual_details || ''}
                        onBlur={(e) => onUpdateDetails && onUpdateDetails(order, e.target.value)}
                      />
                    </td>
                    <td className="p-4 align-middle">
                      <span className="font-bold text-gray-900">
                        {formatPrice(order.payment?.total_amount, order.payment?.currency)}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="text-gray-600 text-sm">
                        {formatDate(order.create_time)}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewDetails(order)}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <a
                          href={`https://seller-my.tiktok.com/order/detail?order_no=${order.id}&shop_region=MY`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Open in TikTok Seller Center"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        {order.status === 'AWAITING_SHIPMENT' && (
                          <button
                            onClick={() => onShipOrder(order)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
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
