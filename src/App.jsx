import { useState, useEffect, useMemo } from 'react';
import LoginForm from './components/LoginForm';
import Header from './components/Header';
import StatsCard from './components/StatsCard';
import FilterBar from './components/FilterBar';
import BulkActions from './components/BulkActions';
import OrderTable from './components/OrderTable';
import ShippingModal from './components/ShippingModal';
import OrderDetailModal from './components/OrderDetailModal';
import { getAuthorizedShops, searchOrders, getOrderDetails, shipPackage, getShippingDocument, getAccessToken } from './lib/tiktokApi';
import { saveCredentials, saveOrder, mergeWaybills } from './lib/supabase';

function App() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('order'); // 'order' or 'processed'

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

  // Filter orders based on active tab
  const orders = useMemo(() => {
    if (activeTab === 'order') {
      // Pending orders - AWAITING_SHIPMENT, UNPAID, PARTIALLY_SHIPPING
      return allOrders.filter(o =>
        ['AWAITING_SHIPMENT', 'UNPAID', 'PARTIALLY_SHIPPING', 'ON_HOLD'].includes(o.status)
      );
    } else {
      // Processed orders - shipped/delivered
      return allOrders.filter(o =>
        ['IN_TRANSIT', 'AWAITING_COLLECTION', 'DELIVERED', 'COMPLETED'].includes(o.status)
      );
    }
  }, [allOrders, activeTab]);

  // Stats for current tab
  const stats = useMemo(() => {
    const tabOrders = orders;
    const uniqueCustomers = new Set(tabOrders.map(o => o.recipient_address?.phone_number).filter(Boolean));
    const totalAmount = tabOrders.reduce((sum, o) => sum + (parseFloat(o.payment?.total_amount) || 0), 0);
    const currency = tabOrders[0]?.payment?.currency || 'MYR';

    if (activeTab === 'order') {
      return {
        totalOrders: tabOrders.length,
        totalCustomers: uniqueCustomers.size,
        awaitingShipment: tabOrders.filter(o => o.status === 'AWAITING_SHIPMENT').length,
        unpaid: tabOrders.filter(o => o.status === 'UNPAID').length,
        onHold: tabOrders.filter(o => o.status === 'ON_HOLD').length,
        totalPrice: totalAmount,
        currency
      };
    } else {
      return {
        totalOrders: tabOrders.length,
        totalCustomers: uniqueCustomers.size,
        inTransit: tabOrders.filter(o => o.status === 'IN_TRANSIT').length,
        awaitingCollection: tabOrders.filter(o => o.status === 'AWAITING_COLLECTION').length,
        delivered: tabOrders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).length,
        totalPrice: totalAmount,
        currency
      };
    }
  }, [orders, activeTab]);

  // Check for saved credentials on mount
  useEffect(() => {
    const saved = localStorage.getItem('tiktok_credentials');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCredentials(parsed);
        setIsLoggedIn(true);
        // Fetch shop info
        handleFetchShopInfo(parsed);
      } catch (e) {
        localStorage.removeItem('tiktok_credentials');
      }
    }
  }, []);

  // Clear selection when switching tabs
  useEffect(() => {
    setSelectedOrders([]);
  }, [activeTab]);

  const handleFetchShopInfo = async (creds) => {
    try {
      const data = await getAuthorizedShops(creds);
      if (data.shops && data.shops.length > 0) {
        setShopInfo(data.shops[0]);
      }
    } catch (error) {
      console.error('Failed to fetch shop info:', error);
    }
  };

  const handleLogin = async (formData) => {
    setLoading(true);
    try {
      // Verify credentials by fetching shops
      const data = await getAuthorizedShops(formData);

      if (!data.shops || data.shops.length === 0) {
        throw new Error('No authorized shops found');
      }

      // Save to localStorage
      localStorage.setItem('tiktok_credentials', JSON.stringify(formData));

      // Save to Supabase
      try {
        await saveCredentials({
          app_key: formData.app_key,
          app_secret: formData.app_secret,
          access_token: formData.access_token,
          shop_cipher: formData.shop_cipher,
          shop_id: data.shops[0].id,
          shop_name: data.shops[0].name
        });
      } catch (e) {
        console.warn('Failed to save to Supabase:', e);
      }

      setCredentials(formData);
      setShopInfo(data.shops[0]);
      setIsLoggedIn(true);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tiktok_credentials');
    setCredentials(null);
    setShopInfo(null);
    setAllOrders([]);
    setSelectedOrders([]);
    setIsLoggedIn(false);
  };

  // Quick login - exchange auth code for access token and get shop cipher
  const handleQuickLogin = async ({ app_key, app_secret, auth_code }) => {
    setLoading(true);
    try {
      // Step 1: Exchange auth code for access token
      const tokenData = await getAccessToken(app_key, app_secret, auth_code);

      if (!tokenData.access_token) {
        throw new Error('Failed to get access token');
      }

      // Build credentials with the token
      const tempCredentials = {
        app_key,
        app_secret,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token
      };

      // Step 2: Get authorized shops to get shop_cipher
      const shopsData = await getAuthorizedShops(tempCredentials);

      if (!shopsData.shops || shopsData.shops.length === 0) {
        throw new Error('No authorized shops found');
      }

      const shop = shopsData.shops[0];

      // Build final credentials with shop_cipher
      const finalCredentials = {
        ...tempCredentials,
        shop_cipher: shop.cipher
      };

      // Save to localStorage
      localStorage.setItem('tiktok_credentials', JSON.stringify(finalCredentials));

      // Save to Supabase
      try {
        await saveCredentials({
          app_key: finalCredentials.app_key,
          app_secret: finalCredentials.app_secret,
          access_token: finalCredentials.access_token,
          refresh_token: finalCredentials.refresh_token,
          shop_cipher: finalCredentials.shop_cipher,
          shop_id: shop.id,
          shop_name: shop.name
        });
      } catch (e) {
        console.warn('Failed to save to Supabase:', e);
      }

      setCredentials(finalCredentials);
      setShopInfo(shop);
      setIsLoggedIn(true);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

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

        setAllOrders(details.orders || data.orders);
        setPageToken(data.next_page_token);
      } else {
        setAllOrders([]);
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
      const errors = [];

      for (const order of ordersToDownload) {
        try {
          const packageId = order.packages?.[0]?.id;
          if (packageId) {
            const doc = await getShippingDocument(credentials, packageId, 'SHIPPING_LABEL');
            if (doc.doc_url) {
              waybillUrls.push(doc.doc_url);
            }
          }
        } catch (e) {
          errors.push(`Order ${order.id}: ${e.message}`);
        }
      }

      if (waybillUrls.length === 0) {
        alert('No waybills available for selected orders.\n\nErrors:\n' + errors.join('\n'));
        return;
      }

      // If only one waybill, open directly
      if (waybillUrls.length === 1) {
        window.open(waybillUrls[0], '_blank');
        return;
      }

      // Merge multiple waybills using Supabase edge function
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

      if (errors.length > 0) {
        console.warn('Some waybills failed:', errors);
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

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} onQuickLogin={handleQuickLogin} loading={loading} />;
  }

  const selectedOrdersForShipping = orders.filter(o =>
    selectedOrders.includes(o.id) && o.status === 'AWAITING_SHIPMENT'
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header shopName={shopInfo?.name} onLogout={handleLogout} />

      <main className="p-6 space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 bg-gray-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('order')}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === 'order'
                ? 'bg-tiktok-pink text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Order
            {allOrders.filter(o => ['AWAITING_SHIPMENT', 'UNPAID', 'PARTIALLY_SHIPPING', 'ON_HOLD'].includes(o.status)).length > 0 && (
              <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">
                {allOrders.filter(o => ['AWAITING_SHIPMENT', 'UNPAID', 'PARTIALLY_SHIPPING', 'ON_HOLD'].includes(o.status)).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('processed')}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
              activeTab === 'processed'
                ? 'bg-tiktok-cyan text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Processed
            {allOrders.filter(o => ['IN_TRANSIT', 'AWAITING_COLLECTION', 'DELIVERED', 'COMPLETED'].includes(o.status)).length > 0 && (
              <span className="bg-green-500 text-black text-xs px-2 py-0.5 rounded-full">
                {allOrders.filter(o => ['IN_TRANSIT', 'AWAITING_COLLECTION', 'DELIVERED', 'COMPLETED'].includes(o.status)).length}
              </span>
            )}
          </button>
        </div>

        {/* Stats Cards - Different for each tab */}
        {activeTab === 'order' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatsCard
              title="Total Processed"
              value={stats.totalOrders}
              color="cyan"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <StatsCard
              title="In Transit"
              value={stats.inTransit}
              color="blue"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              }
            />
            <StatsCard
              title="Awaiting Collection"
              value={stats.awaitingCollection}
              color="yellow"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
            />
            <StatsCard
              title="Delivered"
              value={stats.delivered}
              color="green"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
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
        )}

        {/* Filters */}
        <FilterBar
          onFilter={handleFetchOrders}
          onRefresh={handleRefresh}
          loading={loading}
        />

        {/* Bulk Actions - Different for each tab */}
        <BulkActions
          selectedCount={selectedOrders.length}
          onShipSelected={activeTab === 'order' ? handleBulkShip : null}
          onPrintWaybills={handleBulkPrintWaybills}
          onDownloadWaybills={handleDownloadWaybills}
          loading={shippingLoading}
          printLoading={printLoading}
          activeTab={activeTab}
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
        <div className="text-center text-gray-400 text-sm">
          Showing {orders.length} orders
        </div>
      </main>

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

export default App;
