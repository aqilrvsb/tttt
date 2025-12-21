export default function OrderDetailModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleString('en-MY', {
      year: 'numeric',
      month: 'long',
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

  const customer = order.recipient_address || {};
  const payment = order.payment || {};
  const lineItems = order.line_items || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Order Details</h2>
            <p className="text-sm text-gray-400 mt-1">#{order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-tiktok-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Name</p>
                <p className="text-white">{customer.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Phone</p>
                <p className="text-white">{customer.phone_number || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-400">Address</p>
                <p className="text-white">{customer.full_address || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">City</p>
                <p className="text-white">{customer.city || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Postal Code</p>
                <p className="text-white">{customer.postal_code || '-'}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-tiktok-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Order Items ({lineItems.length})
            </h3>
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-lg">
                  {item.sku_image && (
                    <img
                      src={item.sku_image}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.product_name || 'Unknown Product'}</p>
                    <p className="text-sm text-gray-400">SKU: {item.sku_id || '-'}</p>
                    <p className="text-sm text-gray-400">Qty: {item.quantity || 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-tiktok-cyan font-medium">
                      {formatPrice(item.sale_price, payment.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-tiktok-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Payment Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">{formatPrice(payment.sub_total, payment.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Shipping Fee</span>
                <span className="text-white">{formatPrice(payment.shipping_fee, payment.currency)}</span>
              </div>
              {payment.seller_discount && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Discount</span>
                  <span className="text-green-400">-{formatPrice(payment.seller_discount, payment.currency)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-600">
                <span className="text-white font-medium">Total</span>
                <span className="text-tiktok-pink font-bold text-lg">
                  {formatPrice(payment.total_amount, payment.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-tiktok-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Order Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Created</span>
                <span className="text-white">{formatDate(order.create_time)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Updated</span>
                <span className="text-white">{formatDate(order.update_time)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-tiktok-cyan">{order.status}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
