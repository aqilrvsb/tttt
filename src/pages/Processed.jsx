import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import StatsCard from '../components/StatsCard';
import FilterBar from '../components/FilterBar';
import BulkActions from '../components/BulkActions';
import OrderTable from '../components/OrderTable';
import OrderDetailModal from '../components/OrderDetailModal';
import { searchOrders, getOrderDetails } from '../lib/tiktokApi';
import { saveOrder, getAllOrdersFromDB, getUserCredentials } from '../lib/supabase';

export default function Processed() {
  const navigate = useNavigate();

  // Auth state
  const [credentials, setCredentials] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);

  // Data state
  const [allOrders, setAllOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageToken, setPageToken] = useState('');
  const [clientFilters, setClientFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });

  // UI state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);

  // Filter orders - "Shipped" tab (match TikTok Shop)
  const orders = useMemo(() => {
    let filtered = allOrders.filter(o =>
      ['AWAITING_COLLECTION', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(o.status)
    );

    // Apply client-side date filters
    if (clientFilters.startDate) {
      const startTime = new Date(clientFilters.startDate).getTime() / 1000;
      filtered = filtered.filter(o => o.create_time >= startTime);
    }

    if (clientFilters.endDate) {
      const endTime = (new Date(clientFilters.endDate).getTime() / 1000) + 86400; // End of day
      filtered = filtered.filter(o => o.create_time < endTime);
    }

    // Apply client-side status filter
    if (clientFilters.status) {
      filtered = filtered.filter(o => o.status === clientFilters.status);
    }

    return filtered;
  }, [allOrders, clientFilters]);

  // Stats for "Shipped" orders (match TikTok Shop)
  const stats = useMemo(() => {
    const uniqueCustomers = new Set(orders.map(o => o.recipient_address?.phone_number).filter(Boolean));
    const totalAmount = orders.reduce((sum, o) => sum + (parseFloat(o.payment?.total_amount) || 0), 0);
    const currency = orders[0]?.payment?.currency || 'MYR';

    return {
      totalOrders: orders.length,
      totalCustomers: uniqueCustomers.size,
      awaitingCollection: orders.filter(o => o.status === 'AWAITING_COLLECTION').length,
      inTransit: orders.filter(o => o.status === 'IN_TRANSIT').length,
      delivered: orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).length,
      totalPrice: totalAmount,
      currency
    };
  }, [orders]);

  // Load credentials from database on mount
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const creds = await getUserCredentials();
        if (creds) {
          setCredentials({
            app_key: creds.app_key,
            app_secret: creds.app_secret,
            access_token: creds.access_token,
            shop_cipher: creds.shop_cipher
          });
          setShopInfo({
            shop_id: creds.shop_id,
            shop_name: creds.shop_name
          });
        }
      } catch (error) {
        console.error('Failed to load credentials:', error);
      }
    };

    loadCredentials();
  }, []);

  // Load orders from Supabase on mount and auto-refresh status
  useEffect(() => {
    const loadOrdersFromDB = async () => {
      try {
        const dbOrders = await getAllOrdersFromDB();

        // Convert DB orders back to TikTok order format
        // Merge waybill_url from DB into order data
        const convertedOrders = dbOrders
          .filter(dbOrder => dbOrder.order_data) // Only orders with full data
          .map(dbOrder => ({
            ...dbOrder.order_data,
            saved_waybill_url: dbOrder.waybill_url // Add saved waybill URL
          }));

        if (convertedOrders.length > 0) {
          setAllOrders(convertedOrders);

          // Get shipped orders that are NOT yet COMPLETED (status might need updating)
          const activeShippedOrders = convertedOrders.filter(o =>
            ['AWAITING_COLLECTION', 'IN_TRANSIT', 'DELIVERED'].includes(o.status)
          );

          // If we have credentials and active shipped orders, silently check for status updates
          if (activeShippedOrders.length > 0 && credentials) {
            console.log(`Found ${activeShippedOrders.length} active shipped orders, checking for status updates...`);
            silentRefreshOrderStatus(activeShippedOrders);
          }
        }

        // Auto-set filter to current month (start of month to today)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        setClientFilters({
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0],
          status: ''
        });
      } catch (error) {
        console.error('Failed to load orders from database:', error);
      }
    };

    // Only run when we have credentials loaded
    if (credentials) {
      loadOrdersFromDB();
    }
  }, [credentials]);

  // Silent refresh to check order status updates (no UI popup)
  // Checks if orders have moved from AWAITING_COLLECTION → IN_TRANSIT → DELIVERED → COMPLETED
  const silentRefreshOrderStatus = async (ordersToCheck) => {
    if (!credentials) {
      console.warn('Cannot check status: No credentials available');
      return;
    }

    if (!ordersToCheck || ordersToCheck.length === 0) {
      console.log('No orders to check status');
      return;
    }

    try {
      console.log(`🔍 Checking status for ${ordersToCheck.length} shipped orders...`);

      // Get order IDs
      const orderIds = ordersToCheck.map(o => o.id);

      // Call getOrderDetails API to get latest status
      console.log('📞 Calling getOrderDetails API for status update...');
      const details = await getOrderDetails(credentials, orderIds);
      const fetchedOrders = details.orders || [];

      console.log(`✅ API returned ${fetchedOrders.length} orders`);

      if (fetchedOrders.length === 0) {
        console.warn('⚠️ No orders returned from API');
        return;
      }

      // Check for status changes and update
      let statusChangedCount = 0;
      const dbOrders = await getAllOrdersFromDB();
      const dbOrdersMap = new Map(
        dbOrders
          .filter(o => o.order_data)
          .map(o => [o.order_data.id, o.order_data])
      );

      for (const fetchedOrder of fetchedOrders) {
        const originalOrder = ordersToCheck.find(o => o.id === fetchedOrder.id);
        const dbOrder = dbOrdersMap.get(fetchedOrder.id);

        if (!originalOrder) continue;

        const oldStatus = originalOrder.status;
        const newStatus = fetchedOrder.status;

        // Check if status changed
        if (oldStatus !== newStatus) {
          statusChangedCount++;
          console.log(`📦 Order ${fetchedOrder.id.slice(-8)}: ${oldStatus} → ${newStatus}`);
        }

        // Preserve unmasked customer data from database if new data is masked
        let finalRecipientAddress = fetchedOrder.recipient_address;

        if (dbOrder && dbOrder.recipient_address) {
          const dbName = dbOrder.recipient_address.name || '';
          const fetchedName = fetchedOrder.recipient_address?.name || '';

          // If DB has unmasked data but fetched is masked, preserve DB data
          const dbIsUnmasked = !dbName.includes('***');
          const fetchedIsMasked = fetchedName.includes('***');

          if (dbIsUnmasked && fetchedIsMasked) {
            console.log(`  🔐 Preserving unmasked customer data from database`);
            finalRecipientAddress = dbOrder.recipient_address;
          }
        }

        // Update order with preserved customer data
        const updatedOrder = {
          ...fetchedOrder,
          recipient_address: finalRecipientAddress,
          saved_waybill_url: originalOrder.saved_waybill_url
        };

        // Update in allOrders state
        setAllOrders(prev => prev.map(o =>
          o.id === updatedOrder.id ? updatedOrder : o
        ));

        // Save to database
        try {
          await saveOrder({
            order_id: updatedOrder.id,
            order_status: updatedOrder.status,
            customer_name: finalRecipientAddress?.name,
            customer_phone: finalRecipientAddress?.phone_number,
            customer_address: finalRecipientAddress?.full_address,
            total_amount: updatedOrder.payment?.total_amount,
            currency: updatedOrder.payment?.currency,
            created_at: new Date(updatedOrder.create_time * 1000).toISOString(),
            updated_at: new Date(updatedOrder.update_time * 1000).toISOString()
          }, updatedOrder);
        } catch (e) {
          console.error(`❌ Failed to save order ${updatedOrder.id} to database:`, e);
        }
      }

      console.log(`\n📊 Summary:`);
      console.log(`  - Status changed: ${statusChangedCount} orders`);
      console.log(`  - No change: ${fetchedOrders.length - statusChangedCount} orders`);
    } catch (error) {
      console.error('❌ Silent status refresh failed:', error);
      console.error('Error details:', error.message);
    }
  };

  const handleFetchOrders = async (filters = {}) => {
    if (!credentials) return;

    setLoading(true);

    // Show Swal loading
    Swal.fire({
      title: 'Fetching Orders',
      html: 'Please wait while we fetch orders from TikTok API...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const data = await searchOrders(credentials, {
        ...filters,
        page_size: 50
      });

      if (data.orders && data.orders.length > 0) {
        // Update Swal: Getting details
        Swal.update({
          html: `Fetching details for ${data.orders.length} orders...`
        });

        // Get full order details
        const orderIds = data.orders.map(o => o.id);
        const details = await getOrderDetails(credentials, orderIds);

        let fetchedOrders = details.orders || data.orders;

        // Check if customer data is masked (contains ***)
        const hasMaskedData = fetchedOrders.some(order => {
          const name = order.recipient_address?.name || '';
          const phone = order.recipient_address?.phone_number || '';
          const address = order.recipient_address?.full_address || '';
          return name.includes('***') || name.includes('**') ||
                 phone.includes('***') || phone.includes('*****') ||
                 address.includes('***') || address.includes('**');
        });

        // If data is masked, get original data from database
        if (hasMaskedData) {
          console.log('Detected masked customer data, fetching from database...');

          // Get fresh data from database
          const dbOrders = await getAllOrdersFromDB();

          // Create map of DB orders by order_id
          const dbOrdersMap = new Map(
            dbOrders
              .filter(o => o.order_data)
              .map(o => [o.order_data.id, o.order_data])
          );

          // Replace masked data with database data
          fetchedOrders = fetchedOrders.map(fetchedOrder => {
            const dbOrder = dbOrdersMap.get(fetchedOrder.id);

            // If we have this order in DB with unmasked customer data, use it
            if (dbOrder && dbOrder.recipient_address) {
              const dbName = dbOrder.recipient_address.name || '';
              const fetchedName = fetchedOrder.recipient_address?.name || '';

              // If DB data is not masked but fetched is masked, preserve DB customer data
              if (!dbName.includes('***') && fetchedName.includes('***')) {
                console.log(`Preserving customer data for order ${fetchedOrder.id.slice(-8)}`);
                return {
                  ...fetchedOrder,
                  recipient_address: dbOrder.recipient_address // Preserve customer data
                };
              }
            }

            return fetchedOrder;
          });
        }

        // Create map of existing orders by ID for quick lookup
        const existingOrdersMap = new Map(allOrders.map(o => [o.id, o]));

        // Separate new orders and updated orders
        const newOrders = [];
        const updatedOrders = [];

        for (const fetchedOrder of fetchedOrders) {
          if (existingOrdersMap.has(fetchedOrder.id)) {
            // Order exists - update it with latest data from API
            updatedOrders.push(fetchedOrder);
          } else {
            // Order is new
            newOrders.push(fetchedOrder);
          }
        }

        // Create updated allOrders array:
        // 1. Start with fetched orders (both new and updated with latest status)
        // 2. Add existing orders that weren't in the fetch response
        const fetchedOrderIds = new Set(fetchedOrders.map(o => o.id));
        const unchangedOrders = allOrders.filter(o => !fetchedOrderIds.has(o.id));
        const mergedOrders = [...fetchedOrders, ...unchangedOrders];

        setAllOrders(mergedOrders);
        setPageToken(data.next_page_token);

        // Save ALL fetched orders to Supabase (upsert will handle updates)
        for (const order of fetchedOrders) {
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

        console.log(`Fetched ${fetchedOrders.length} orders: ${newOrders.length} new, ${updatedOrders.length} updated`);

        // If there are updated orders, log which ones changed status
        if (updatedOrders.length > 0) {
          const statusChanged = updatedOrders.filter(updated => {
            const existing = existingOrdersMap.get(updated.id);
            return existing && existing.status !== updated.status;
          });
          if (statusChanged.length > 0) {
            console.log(`${statusChanged.length} orders changed status:`,
              statusChanged.map(o => `${o.id.slice(-8)}: ${existingOrdersMap.get(o.id).status} → ${o.status}`)
            );
          }
        }

        // Show success
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          html: `<div>
            <p><strong>${fetchedOrders.length}</strong> orders fetched</p>
            <p><strong>${newOrders.length}</strong> new orders</p>
            <p><strong>${updatedOrders.length}</strong> updated orders</p>
          </div>`,
          timer: 3000,
          showConfirmButton: false
        });
      } else {
        // No orders found
        Swal.fire({
          icon: 'info',
          title: 'No Orders Found',
          text: 'No orders found for the selected date',
          timer: 2000,
          showConfirmButton: false
        });
      }

      setSelectedOrders([]);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to fetch orders: ' + error.message
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
          Shipped
        </h1>
        <p className="text-gray-600 mt-2">Orders that have been shipped and on the way to customers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatsCard
          title="Total Shipped"
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

      {/* Filters */}
      <FilterBar
        onFetch={handleFetchOrders}
        onFilterChange={setClientFilters}
        loading={loading}
        initialFilters={clientFilters}
        showFetchSection={false}
        statusOptions={[
          { value: 'AWAITING_COLLECTION', label: 'Awaiting Collection' },
          { value: 'IN_TRANSIT', label: 'In Transit' },
          { value: 'DELIVERED', label: 'Delivered' },
          { value: 'COMPLETED', label: 'Completed (note: customer data will be masked)' }
        ]}
      />

      {/* Bulk Actions - No buttons for shipped page */}
      <BulkActions
        selectedCount={selectedOrders.length}
        onShipSelected={null}
        onPrintWaybills={null}
        onDownloadWaybills={null}
        loading={false}
        printLoading={false}
        activeTab="processed"
      />

      {/* Orders Table */}
      <OrderTable
        orders={orders}
        selectedOrders={selectedOrders}
        onSelectOrder={handleSelectOrder}
        onSelectAll={handleSelectAll}
        onViewDetails={handleViewDetails}
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
