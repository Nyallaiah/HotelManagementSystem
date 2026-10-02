import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, Clock, CheckCircle2, ChevronRight, 
  RefreshCw, ChefHat, AlertCircle, ShoppingBag 
} from 'lucide-react';
import { api } from '../../services/api';

export const KitchenPOS = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active'); // active | delivered | all
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000); // 15s auto-refresh for kitchen display
    return () => clearInterval(interval);
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load kitchen tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (orderId, currentStatus) => {
    let nextStatus = 'preparing';
    if (currentStatus === 'received') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'dispatched';
    else if (currentStatus === 'dispatched') nextStatus = 'delivered';

    setUpdatingId(orderId);
    try {
      await api.updateOrderStatus(orderId, nextStatus);
      await fetchOrders();
    } catch (err) {
      alert('Failed to update ticket: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'received':
        return { bg: 'bg-rose-100 text-rose-800 border-rose-200', label: 'New Ticket (Received)', nextBtn: 'Start Cooking' };
      case 'preparing':
        return { bg: 'bg-amber-100 text-amber-800 border-amber-200', label: 'In Kitchen (Preparing)', nextBtn: 'Send to Room' };
      case 'dispatched':
        return { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', label: 'Out for Room Delivery', nextBtn: 'Mark Delivered' };
      case 'delivered':
        return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Delivered', nextBtn: null };
      default:
        return { bg: 'bg-slate-100 text-slate-800 border-slate-200', label: status, nextBtn: null };
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'active') return ['received', 'preparing', 'dispatched'].includes(o.status);
    if (statusFilter === 'delivered') return o.status === 'delivered';
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-hotel-gold-600" />
            Kitchen Order Display (KOT) & Room Service
          </h1>
          <p className="text-xs text-slate-500">Live order queue for Executive Chefs and In-Room Delivery Staff.</p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition shadow-sm self-start sm:self-auto"
          title="Refresh Queue"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { id: 'active', label: `Active Kitchen Queue (${orders.filter(o => ['received', 'preparing', 'dispatched'].includes(o.status)).length})` },
          { id: 'delivered', label: 'Delivered History' },
          { id: 'all', label: `All Tickets (${orders.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
              statusFilter === tab.id
                ? 'bg-hotel-navy-950 text-hotel-gold-400 shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Loading active kitchen tickets...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">No Orders in Queue</h3>
          <p className="text-xs mt-1">All in-room dining orders have been serviced and delivered.</p>
        </div>
      ) : (
        /* Kitchen Order Ticket Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const isUpdating = updatingId === order.order_id;

            return (
              <div
                key={order.order_id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                {/* Ticket Header */}
                <div className="bg-slate-50 p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-hotel-navy-950">
                      {order.order_id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-slate-800">
                      Deliver to: <strong className="text-sm font-serif text-hotel-gold-700">Room #{order.room_number}</strong>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Guest: {order.guest_name} • Ref: {order.booking_reference}
                  </div>
                </div>

                {/* Items Ordered */}
                <div className="p-4 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Ordered Dishes
                  </span>
                  <div className="space-y-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          ₹{Number(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="mt-3 p-2 bg-amber-50 rounded text-[11px] text-amber-800 border border-amber-200">
                      Note: {order.notes}
                    </div>
                  )}
                </div>

                {/* Ticket Footer & Actions */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Total Amount</span>
                    <span className="text-sm font-bold text-slate-900">₹{Number(order.total || 0).toLocaleString('en-IN')}</span>
                    <span className="text-[9px] text-emerald-700 font-medium block">✓ Billed to Suite Folio</span>
                  </div>

                  {badge.nextBtn && (
                    <button
                      onClick={() => handleStatusTransition(order.order_id, order.status)}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-hotel-navy-950 hover:bg-hotel-navy-800 text-hotel-gold-400 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <span>{isUpdating ? 'Updating...' : badge.nextBtn}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
