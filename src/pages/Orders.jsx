import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import StatsCard from '../components/StatsCard';
import FilterBar from '../components/FilterBar';
import BulkActions from '../components/BulkActions';
import OrderTable from '../components/OrderTable';
import OrderDetailModal from '../components/OrderDetailModal';
import { searchOrders, getOrderDetails, getShippingDocument, shipPackage } from '../lib/tiktokApi';
import { saveOrder, mergeWaybills, getAllOrdersFromDB } from '../lib/supabase';

export default function Orders() {
  const navigate = useNavigate();

  // Auth state
  const [credentials, setCredentials] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);

  // Data state
  const [allOrders, setAllOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [clientFilters, setClientFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });
  const [pageToken, setPageToken] = useState(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);

  // Filter orders - "To Ship" tab (match TikTok Shop)
  const orders = useMemo(() => {
    let filtered = allOrders.filter(o =>
      ['AWAITING_SHIPMENT', 'UNPAID'].includes(o.status)
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

  // Stats for "To Ship" orders (match TikTok Shop)
  const stats = useMemo(() => {
    const uniqueCustomers = new Set(orders.map(o => o.recipient_address?.phone_number).filter(Boolean));
    const totalAmount = orders.reduce((sum, o) => sum + (parseFloat(o.payment?.total_amount) || 0), 0);
    const currency = orders[0]?.payment?.currency || 'MYR';

    return {
      totalOrders: orders.length,
      totalCustomers: uniqueCustomers.size,
      awaitingShipment: orders.filter(o => o.status === 'AWAITING_SHIPMENT').length,
      unpaid: orders.filter(o => o.status === 'UNPAID').length,
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
        // Merge waybill_url from DB into order data
        const convertedOrders = dbOrders
          .filter(dbOrder => dbOrder.order_data) // Only orders with full data
          .map(dbOrder => ({
            ...dbOrder.order_data,
            saved_waybill_url: dbOrder.waybill_url // Add saved waybill URL
          }));

        if (convertedOrders.length > 0) {
          setAllOrders(convertedOrders);
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

    loadOrdersFromDB();
  }, []);

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


  // Bulk print waybills - auto ship orders and get waybills
  const handleBulkPrintWaybills = async () => {
    const ordersToProcess = orders.filter(o => selectedOrders.includes(o.id));

    if (ordersToProcess.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Orders Selected',
        text: 'Please select orders to print waybills'
      });
      return;
    }

    setPrintLoading(true);

    // Show progress modal
    Swal.fire({
      title: 'Processing Orders',
      html: `<div>
        <p>Arranging shipping and generating waybills...</p>
        <p class="text-sm text-gray-500 mt-2">0 of ${ordersToProcess.length} processed</p>
      </div>`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const waybillUrls = [];
      const shippedOrders = [];
      const errors = [];
      let processedCount = 0;

      for (const order of ordersToProcess) {
        processedCount++;

        // Update progress
        Swal.update({
          html: `<div>
            <p>Arranging shipping and generating waybills...</p>
            <p class="text-sm text-gray-500 mt-2">${processedCount} of ${ordersToProcess.length} processed</p>
            <p class="text-xs text-gray-400 mt-1">Order ${order.id.slice(-8)}</p>
          </div>`
        });

        try {
          // Check if we have a saved waybill URL
          if (order.saved_waybill_url) {
            waybillUrls.push(order.saved_waybill_url);
            console.log(`Using saved waybill for order ${order.id.slice(-8)}`);
            continue;
          }

          const packageId = order.packages?.[0]?.id;
          if (!packageId) {
            errors.push(`Order ${order.id.slice(-8)}: No package ID`);
            continue;
          }

          // Try to get waybill first (might already be shipped)
          try {
            const doc = await getShippingDocument(credentials, packageId, 'SHIPPING_LABEL');
            if (doc.doc_url) {
              waybillUrls.push(doc.doc_url);

              // Save waybill URL to database
              await saveOrder({
                order_id: order.id,
                order_status: order.status,
                waybill_url: doc.doc_url,
                customer_name: order.recipient_address?.name,
                customer_phone: order.recipient_address?.phone_number,
                customer_address: order.recipient_address?.full_address,
                total_amount: order.payment?.total_amount,
                currency: order.payment?.currency,
                created_at: new Date(order.create_time * 1000).toISOString(),
                updated_at: new Date(order.update_time * 1000).toISOString()
              }, order);

              continue;
            }
          } catch (waybillError) {
            // If waybill doesn't exist, ship the order first
            if (waybillError.message.includes('before shipped') || waybillError.message.includes('21042104')) {
              console.log(`Shipping order ${order.id.slice(-8)} first...`);

              // Ship the package
              await shipPackage(credentials, packageId, 'PICKUP');
              shippedOrders.push(order.id);

              // Wait a moment for TikTok to generate waybill
              await new Promise(resolve => setTimeout(resolve, 1000));

              // Now get the waybill
              const doc = await getShippingDocument(credentials, packageId, 'SHIPPING_LABEL');
              if (doc.doc_url) {
                waybillUrls.push(doc.doc_url);

                // Save waybill URL to database
                await saveOrder({
                  order_id: order.id,
                  order_status: 'AWAITING_COLLECTION',
                  waybill_url: doc.doc_url,
                  customer_name: order.recipient_address?.name,
                  customer_phone: order.recipient_address?.phone_number,
                  customer_address: order.recipient_address?.full_address,
                  total_amount: order.payment?.total_amount,
                  currency: order.payment?.currency,
                  created_at: new Date(order.create_time * 1000).toISOString(),
                  updated_at: new Date().toISOString()
                }, order);
              }
            } else {
              throw waybillError;
            }
          }
        } catch (orderError) {
          console.error(`Error processing order ${order.id}:`, orderError);
          errors.push(`Order ${order.id.slice(-8)}: ${orderError.message}`);
        }
      }

      // Close progress modal
      Swal.close();

      // Show results
      if (waybillUrls.length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'No Waybills Generated',
          html: `<div class="text-left">
            <p class="mb-2">Could not generate any waybills.</p>
            ${errors.length > 0 ? `<p class="text-sm text-gray-600">Errors:</p><ul class="text-xs text-red-600 list-disc list-inside">${errors.map(e => `<li>${e}</li>`).join('')}</ul>` : ''}
          </div>`
        });
        setPrintLoading(false);
        return;
      }

      // Show success message
      if (shippedOrders.length > 0) {
        await Swal.fire({
          icon: 'success',
          title: 'Orders Shipped!',
          html: `<div>
            <p><strong>${shippedOrders.length}</strong> orders arranged for shipping</p>
            <p><strong>${waybillUrls.length}</strong> waybills generated</p>
            ${errors.length > 0 ? `<p class="text-sm text-orange-600 mt-2">${errors.length} orders had errors</p>` : ''}
          </div>`,
          timer: 3000,
          showConfirmButton: false
        });
      }

      // Refresh orders to update status
      if (shippedOrders.length > 0) {
        setAllOrders(prev => prev.map(o =>
          shippedOrders.includes(o.id)
            ? { ...o, status: 'AWAITING_COLLECTION' }
            : o
        ));
      }

      // Open or merge waybills
      if (waybillUrls.length === 1) {
        window.open(waybillUrls[0], '_blank');
      } else if (waybillUrls.length > 1) {
        const mergedPdfBlob = await mergeWaybills(waybillUrls);

        if (mergedPdfBlob) {
          const url = URL.createObjectURL(mergedPdfBlob);
          window.open(url, '_blank');
        } else {
          // Fallback: open all waybills in separate tabs
          Swal.fire({
            icon: 'info',
            title: 'Opening Waybills',
            text: `Could not merge PDFs. Opening ${waybillUrls.length} waybills in separate tabs.`,
            timer: 2000
          });
          waybillUrls.forEach(url => window.open(url, '_blank'));
        }
      }

      // Show errors if any
      if (errors.length > 0 && waybillUrls.length > 0) {
        setTimeout(() => {
          Swal.fire({
            icon: 'warning',
            title: 'Some Orders Had Errors',
            html: `<div class="text-left">
              <p class="mb-2">${errors.length} orders could not be processed:</p>
              <ul class="text-xs text-red-600 list-disc list-inside max-h-40 overflow-y-auto">
                ${errors.map(e => `<li>${e}</li>`).join('')}
              </ul>
            </div>`
          });
        }, 3500);
      }

    } catch (error) {
      console.error('Failed to print waybills:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to print waybills: ' + error.message
      });
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
        // First, check if we have a saved waybill URL
        if (order.saved_waybill_url) {
          window.open(order.saved_waybill_url, '_blank');
          continue;
        }

        // If not saved, try to fetch from TikTok API
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
          To Ship
        </h1>
        <p className="text-gray-600 mt-2">Orders ready to be packed and shipped</p>
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
        onFetch={handleFetchOrders}
        onFilterChange={setClientFilters}
        loading={loading}
        initialFilters={clientFilters}
        statusOptions={[
          { value: 'UNPAID', label: 'Unpaid' },
          { value: 'AWAITING_SHIPMENT', label: 'Awaiting Shipment' }
        ]}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedOrders.length}
        onPrintWaybills={handleBulkPrintWaybills}
        onDownloadWaybills={handleDownloadWaybills}
        printLoading={printLoading}
        activeTab="order"
      />

      {/* Orders Table */}
      <OrderTable
        orders={orders}
        selectedOrders={selectedOrders}
        onSelectOrder={handleSelectOrder}
        onSelectAll={handleSelectAll}
        onViewDetails={handleViewDetails}
      />

      {/* Pagination Info */}
      <div className="text-center text-gray-500 text-sm mt-6">
        Showing {orders.length} orders
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        order={selectedOrderForDetail}
      />
    </div>
  );
}
