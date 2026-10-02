import React, { useState, useEffect } from 'react';
import { 
  Grid3X3, Sparkles, Check, AlertCircle, Wrench, RefreshCw, 
  Filter, CheckCircle2, User, Clock, ArrowUpDown 
} from 'lucide-react';
import { api } from '../../services/api';

export const RoomMatrix = () => {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingRoom, setUpdatingRoom] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const data = await api.getFloorGrid();
      setFloors(data);
    } catch (err) {
      console.error('Failed to load room matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (roomNumber, newStatus) => {
    setUpdatingRoom(roomNumber);
    try {
      await api.updateRoomStatus(roomNumber, newStatus);
      setStatusMessage(`Room #${roomNumber} updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
      setTimeout(() => setStatusMessage(null), 4000);
      await fetchMatrix();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingRoom(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'vacant_clean':
        return {
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-800',
          dot: 'bg-emerald-500',
          label: 'Vacant Clean',
          btnAction: null
        };
      case 'vacant_dirty':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-900',
          dot: 'bg-amber-500',
          label: 'Vacant Dirty',
          quickTo: 'vacant_clean',
          quickLabel: 'Mark Cleaned'
        };
      case 'occupied':
        return {
          bg: 'bg-rose-50 border-rose-300 text-rose-900',
          dot: 'bg-rose-500',
          label: 'Occupied',
          btnAction: null
        };
      case 'reserved':
        return {
          bg: 'bg-indigo-50 border-indigo-300 text-indigo-900',
          dot: 'bg-indigo-500',
          label: 'Reserved',
          btnAction: null
        };
      case 'maintenance':
        return {
          bg: 'bg-slate-100 border-slate-300 text-slate-800',
          dot: 'bg-slate-500',
          label: 'Maintenance',
          quickTo: 'vacant_clean',
          quickLabel: 'Restore to Clean'
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-700',
          dot: 'bg-slate-400',
          label: status
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">Visual Room Rack & Housekeeping Matrix</h1>
          <p className="text-xs text-slate-500">Live floor-by-floor room status board. Click any room status to toggle.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchMatrix}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition shadow-sm"
            title="Refresh Grid"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { id: 'all', label: 'All Rooms' },
          { id: 'vacant_clean', label: 'Vacant Clean (Ready)' },
          { id: 'vacant_dirty', label: 'Vacant Dirty (Needs Housekeeping)' },
          { id: 'occupied', label: 'Occupied' },
          { id: 'reserved', label: 'Reserved' },
          { id: 'maintenance', label: 'Maintenance' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
              filterStatus === tab.id
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
          Loading property matrix...
        </div>
      ) : (
        /* Floors Representation */
        <div className="space-y-8">
          {floors.map((floorObj) => {
            const filteredRooms = filterStatus === 'all'
              ? floorObj.rooms
              : floorObj.rooms.filter(r => r.status === filterStatus);

            if (filteredRooms.length === 0) return null;

            return (
              <div key={floorObj.floor} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                
                {/* Floor Title */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-lg bg-hotel-navy-950 text-hotel-gold-400 text-xs font-bold flex items-center justify-center">
                      L{floorObj.floor}
                    </span>
                    <h2 className="font-serif font-bold text-slate-900 text-base">
                      {floorObj.floor_label}
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500">
                    {filteredRooms.length} rooms listed
                  </span>
                </div>

                {/* Rooms Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                  {filteredRooms.map((room) => {
                    const badge = getStatusBadge(room.status);
                    const isUpdating = updatingRoom === room.room_number;

                    return (
                      <div
                        key={room.room_number}
                        className={`rounded-xl border p-4 transition-all ${badge.bg} flex flex-col justify-between shadow-xs hover:shadow-md relative`}
                      >
                        <div>
                          {/* Room Header */}
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-mono font-bold text-slate-900">
                              #{room.room_number}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                              {badge.label}
                            </span>
                          </div>

                          <div className="text-[11px] font-medium text-slate-700 mt-1 line-clamp-1">
                            {room.type}
                          </div>

                          <div className="text-[10px] text-slate-500 mt-0.5">
                            ${room.base_price_per_night} / night
                          </div>
                        </div>

                        {/* Room Actions / Status changer */}
                        <div className="mt-4 pt-3 border-t border-black/10">
                          {badge.quickTo && (
                            <button
                              onClick={() => handleStatusChange(room.room_number, badge.quickTo)}
                              disabled={isUpdating}
                              className="w-full mb-1.5 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center space-x-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>{badge.quickLabel}</span>
                            </button>
                          )}

                          <select
                            value={room.status}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(room.room_number, e.target.value)}
                            className="w-full text-[11px] bg-white/90 border border-slate-300 rounded px-1.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-hotel-gold-500"
                          >
                            <option value="vacant_clean">Vacant Clean</option>
                            <option value="vacant_dirty">Vacant Dirty</option>
                            <option value="occupied">Occupied</option>
                            <option value="reserved">Reserved</option>
                            <option value="maintenance">Maintenance</option>
                          </select>

                          {room.last_cleaned_at && (
                            <div className="text-[9px] text-slate-500 mt-1 truncate">
                              Cleaned: {room.last_cleaned_at.split(' ')[0]}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
