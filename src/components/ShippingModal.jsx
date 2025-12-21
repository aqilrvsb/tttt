import { useState, useEffect } from 'react';

export default function ShippingModal({ isOpen, onClose, orders, onShip, credentials }) {
  const [progress, setProgress] = useState([]);
  const [isShipping, setIsShipping] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [waybills, setWaybills] = useState([]);

  useEffect(() => {
    if (isOpen && orders.length > 0) {
      setProgress(orders.map(order => ({
        orderId: order.id,
        status: 'pending',
        message: 'Waiting...'
      })));
      setCompleted(false);
      setWaybills([]);
    }
  }, [isOpen, orders]);

  const startShipping = async () => {
    setIsShipping(true);
    const newWaybills = [];

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];

      // Update status to processing
      setProgress(prev => prev.map((p, idx) =>
        idx === i ? { ...p, status: 'processing', message: 'Processing...' } : p
      ));

      try {
        // Call the ship function
        const result = await onShip(order);

        if (result.waybillUrl) {
          newWaybills.push({
            orderId: order.id,
            url: result.waybillUrl
          });
        }

        // Update status to success
        setProgress(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'success', message: 'Shipped successfully!' } : p
        ));
      } catch (error) {
        // Update status to error
        setProgress(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'error', message: error.message || 'Failed to ship' } : p
        ));
      }

      // Small delay between orders
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setWaybills(newWaybills);
    setIsShipping(false);
    setCompleted(true);
  };

  const downloadAllWaybills = () => {
    waybills.forEach((waybill, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = waybill.url;
        link.download = `waybill-${waybill.orderId}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 500);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            {completed ? 'Shipping Complete' : 'Shipping Orders'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {progress.map((item, index) => (
            <div
              key={item.orderId}
              className={`flex items-center gap-4 p-4 rounded-lg ${
                item.status === 'success' ? 'bg-green-900/30 border-l-4 border-green-500' :
                item.status === 'error' ? 'bg-red-900/30 border-l-4 border-red-500' :
                item.status === 'processing' ? 'bg-blue-900/30 border-l-4 border-blue-500' :
                'bg-gray-700/50 border-l-4 border-gray-600'
              }`}
            >
              <div className="flex-shrink-0">
                {item.status === 'success' ? (
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : item.status === 'error' ? (
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : item.status === 'processing' ? (
                  <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Order #{item.orderId?.slice(-8)}</p>
                <p className="text-sm text-gray-400">{item.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          {!isShipping && !completed && (
            <button
              onClick={startShipping}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Start Shipping
            </button>
          )}

          {completed && waybills.length > 0 && (
            <button
              onClick={downloadAllWaybills}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download All Waybills ({waybills.length})
            </button>
          )}

          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isShipping}
          >
            {completed ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
