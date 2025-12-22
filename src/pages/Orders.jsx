import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import FilterBar from '../components/FilterBar';
import BulkActions from '../components/BulkActions';
import OrderTable from '../components/OrderTable';
import ShippingModal from '../components/ShippingModal';
import OrderDetailModal from '../components/OrderDetailModal';
import { searchOrders, getOrderDetails, shipPackage, getShippingDocument } from '../lib/tiktokApi';
import { saveOrder, mergeWaybills, getAllOrdersFromDB } from '../lib/supabase';

export default function Orders() {
  const navigate = useNavigate();

  // Auth state
  const [credentials, setCredentials] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);

  // Data state
  const [allOrders, setAllOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [currentFilters, setCurrentFilters] = useState({});
  const [pageToken, setPageToken] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);

  // Filter orders - only pending orders (AWAITING_SHIPMENT, UNPAID, PARTIALLY_SHIPPING, ON_HOLD)
  const orders = useMemo(() => {
    return allOrders.filter(o =>
      ['AWAITING_SHIPMENT', 'UNPAID', 'PARTIALLY_SHIPPING', 'ON_HOLD'].includes(o.status)
    );
  }, [allOrders]);

  // Stats for pending orders
  const stats = useMemo(() => {
    const uniqueCustomers = new Set(orders.map(o => o.recipient_address?.phone_number).filter(Boolean));
    const totalAmount = orders.reduce((sum, o) => sum + (parseFloat(o.payment?.total_amount) || 0), 0);
    const currency = orders[0]?.payment?.currency || 'MYR';

    return {
      totalOrders: orders.length,
      totalCustomers: uniqueCustomers.size,
      awaitingShipment: orders.filter(o => o.status === 'AWAITING_SHIPMENT').length,
      unpaid: orders.filter(o => o.status === 'UNPAID').length,
      onHold: orders.filter(o => o.status === 'ON_HOLD').length,
      totalPrice: totalAmount,
      currency
    };
  }, [orders]);

  // Check for credentials on mount - redirect to settings if not found
  useEffect(() => {
    const saved = localStorage.getItem('tiktok_credentials');
    if (!saved) {
      navigate('/settings');
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      setCredentials(parsed);
    } catch (e) {
      localStorage.removeItem('tiktok_credentials');
      navigate('/settings');
    }
  }, [navigate]);

  // Load orders from Supabase on mount
  useEffect(() => {
    const loadOrdersFromDB = async () => {
      try {
        const dbOrders = await getAllOrdersFromDB();

        // Convert DB orders back to TikTok order format
        const convertedOrders = dbOrders
          .filter(dbOrder => dbOrder.order_data) // Only orders with full data
          .map(dbOrder => dbOrder.order_data);

        if (convertedOrders.length > 0) {
          setAllOrders(convertedOrders);
        }
      } catch (error) {
        console.error('Failed to load orders from database:', error);
      }
    };

    loadOrdersFromDB();
  }, []);

  const handleFetchOrders = async (filters = {}) => {
    if (!credentials) return;

    setLoading(true);
    setCurrentFilters(filters);

    try {
      const data = await searchOrders(credentials, {
        ...filters,
        page_size: 50
      });

      if (data.orders && data.orders.length > 0) {
        // Get full order details
        const orderIds = data.orders.map(o => o.id);
        const details = await getOrderDetails(credentials, orderIds);

        const fetchedOrders = details.orders || data.orders;

        // Get existing order IDs from current state
        const existingOrderIds = new Set(allOrders.map(o => o.id));

        // Filter out orders that already exist
        const newOrders = fetchedOrders.filter(order => !existingOrderIds.has(order.id));

        // Merge new orders with existing orders
        const mergedOrders = [...newOrders, ...allOrders];
        setAllOrders(mergedOrders);
        setPageToken(data.next_page_token);

        // Auto-save only NEW orders to Supabase
        for (const order of newOrders) {
          try {
            await saveOrder({
              order_id: order.id,
              order_status: order.status,
              customer_name: order.recipient_address?.name,
              customer_phone: order.recipient_address?.phone_number,
              customer_address: order.recipient_address?.full_address,
              total_amount: order.payment?.total_amount,
              currency: order.payment?.currency,
              created_at: new Date(order.create_time * 1000).toISOString(),
              updated_at: new Date(order.update_time * 1000).toISOString()
            }, order); // Pass full order data as second parameter
          } catch (e) {
            console.warn(`Failed to save order ${order.id} to Supabase:`, e);
          }
        }

        if (newOrders.length > 0) {
          console.log(`Added ${newOrders.length} new orders. Skipped ${fetchedOrders.length - newOrders.length} duplicates.`);
        }
      }

      setSelectedOrders([]);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      alert('Failed to fetch orders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    handleFetchOrders(currentFilters);
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      }
      return [...prev, orderId];
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(orders.map(o => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleShipOrder = async (order) => {
    if (!credentials) return { success: false };

    try {
      // Get package ID from order
      const packageId = order.packages?.[0]?.id;

      if (!packageId) {
        throw new Error('No package found for this order');
      }

      // Ship the package
      await shipPackage(credentials, packageId, 'PICKUP');

      // Try to get waybill
      let waybillUrl = null;
      try {
        const doc = await getShippingDocument(credentials, packageId, 'SHIPPING_LABEL');
        waybillUrl = doc.doc_url;
      } catch (e) {
        console.warn('Could not get waybill:', e);
      }

      // Save to Supabase
      try {
        await saveOrder({
          order_id: order.id,
          order_status: 'SHIPPED',
          customer_name: order.recipient_address?.name,
          customer_phone: order.recipient_address?.phone_number,
          customer_address: order.recipient_address?.full_address,
          total_amount: order.payment?.total_amount,
          shipped_at: new Date().toISOString(),
          waybill_url: waybillUrl
        });
      } catch (e) {
        console.warn('Failed to save to Supabase:', e);
      }

      return { success: true, waybillUrl };
    } catch (error) {
      throw error;
    }
  };

  const handleBulkShip = () => {
    const ordersToShip = orders.filter(o =>
      selectedOrders.includes(o.id) && o.status === 'AWAITING_SHIPMENT'
    );

    if (ordersToShip.length === 0) {
      alert('No orders available for shipping. Only orders with "Awaiting Shipment" status can be shipped.');
      return;
    }

    setShowShippingModal(true);
  };

  // Bulk print waybills - fetch all and merge into single PDF
  const handleBulkPrintWaybills = async () => {
    const ordersToDownload = orders.filter(o => selectedOrders.includes(o.id));

    if (ordersToDownload.length === 0) {
      alert('Please select orders to print waybills');
      return;
    }

    setPrintLoading(true);

    try {
      // Collect all waybill URLs
      const waybillUrls = [];

      for (const order of ordersToDownload) {
        const packageId = order.packages?.[0]?.id;
        if (packageId) {
          const doc = await getShippingDocument(credentials, packageId, 'SHIPPING_LABEL');
          if (doc.doc_url) {
            waybillUrls.push(doc.doc_url);
          }
        }
      }

      // If only one waybill, open directly
      if (waybillUrls.length === 1) {
        window.open(waybillUrls[0], '_blank');
        setPrintLoading(false);
        return;
      }

      // Merge multiple waybills using Supabase edge function
      if (waybillUrls.length > 1) {
        const mergedPdfBlob = await mergeWaybills(waybillUrls);

        if (mergedPdfBlob) {
          // Create object URL and open in new tab
          const url = URL.createObjectURL(mergedPdfBlob);
          window.open(url, '_blank');
        } else {
          // Fallback: open all waybills in separate tabs
          alert(`Could not merge PDFs. Opening ${waybillUrls.length} waybills in separate tabs.`);
          waybillUrls.forEach(url => window.open(url, '_blank'));
        }
      }
    } catch (error) {
      console.error('Failed to print waybills:', error);
      alert('Failed to print waybills: ' + error.message);
    } finally {
      setPrintLoading(false);
    }
  };

  // Download individual waybills (legacy - opens each in new tab)
  const handleDownloadWaybills = async () => {
    const ordersToDownload = orders.filter(o => selectedOrders.includes(o.id));

    if (ordersToDownload.length === 0) {
      alert('Please select orders to download waybills');
      return;
    }

    for (const order of ordersToDownload) {
      try {
        const packageId = order.packages?.[0]?.id;
        if (packageId) {
          const doc = await getShippingDocument(credentials, packageId, 'SHIPPING_LABEL');
          if (doc.doc_url) {
            window.open(doc.doc_url, '_blank');
          }
        }
      } catch (e) {
        console.warn(`Failed to get waybill for order ${order.id}:`, e);
      }
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrderForDetail(order);
    setShowDetailModal(true);
  };

  const formatPrice = (amount, currency = 'MYR') => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const selectedOrdersForShipping = orders.filter(o =>
    selectedOrders.includes(o.id) && o.status === 'AWAITING_SHIPMENT'
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
          Orders
        </h1>
        <p className="text-gray-600 mt-2">Manage pending orders awaiting shipment</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders}
          color="pink"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatsCard
          title="Awaiting Shipment"
          value={stats.awaitingShipment}
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Unpaid"
          value={stats.unpaid}
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Customers"
          value={stats.totalCustomers}
          color="cyan"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Sales"
          value={formatPrice(stats.totalPrice, stats.currency)}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* Filters */}
      <FilterBar
        onFilter={handleFetchOrders}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedOrders.length}
        onShipSelected={handleBulkShip}
        onPrintWaybills={handleBulkPrintWaybills}
        onDownloadWaybills={handleDownloadWaybills}
        loading={shippingLoading}
        printLoading={printLoading}
        activeTab="order"
      />

      {/* Orders Table */}
      <OrderTable
        orders={orders}
        selectedOrders={selectedOrders}
        onSelectOrder={handleSelectOrder}
        onSelectAll={handleSelectAll}
        onShipOrder={(order) => {
          setSelectedOrders([order.id]);
          setShowShippingModal(true);
        }}
        onViewDetails={handleViewDetails}
      />

      {/* Pagination Info */}
      <div className="text-center text-gray-500 text-sm mt-6">
        Showing {orders.length} orders
      </div>

      {/* Shipping Modal */}
      <ShippingModal
        isOpen={showShippingModal}
        onClose={() => {
          setShowShippingModal(false);
          handleRefresh();
        }}
        orders={selectedOrdersForShipping}
        onShip={handleShipOrder}
        credentials={credentials}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        order={selectedOrderForDetail}
      />
    </div>
  );
}
