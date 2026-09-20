import React, { useState, useEffect } from 'react';
import {
  Wrench,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Send,
  Calendar,
  Filter,
  Check,
  Building2,
  ArrowRight
} from 'lucide-react';
import { MaintenanceTicket } from '../types';
import { api } from '../services/api';

interface MaintenancePageProps {
  onSelectStation: (id: string) => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ onSelectStation }) => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('All');

  useEffect(() => {
    const fetchMaintenance = async () => {
      setLoading(true);
      try {
        const data = await api.getMaintenance();
        setTickets(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaintenance();
  }, []);

  const handleStatusChange = (ticketId: string, newStatus: 'Scheduled' | 'Resolved') => {
    setTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
  };

  const filtered = tickets.filter(t => {
    if (priorityFilter === 'All') return true;
    return t.priority === priorityFilter;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Predictive Maintenance Queue
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-300 font-semibold">
              {tickets.length} TICKETS ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Automated sensor recalibration, wiring inspection, and technician dispatch scheduling
          </p>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-sans shadow-xs">
          <span className="text-slate-500 px-2 text-[10px] uppercase font-semibold">Priority:</span>
          {['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1 rounded transition text-[11px] ${
                priorityFilter === p
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p === 'All' ? 'All' : p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="lg:col-span-2 p-12 bg-white rounded-2xl border border-slate-200 shadow-xs text-center flex flex-col items-center justify-center gap-3">
            <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No Outstanding Maintenance Required</h3>
            <p className="text-xs text-slate-500 max-w-md">
              All AWS sensor transducers are performing with normal baseline drift parameters. No physical recalibration or technician dispatches are needed.
            </p>
          </div>
        ) : (
          filtered.map(ticket => {
            const isCrit = ticket.priority === 'CRITICAL';
            const isResolved = ticket.status === 'Resolved';

            return (
              <div
                key={ticket.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-cyan-400 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-800">{ticket.id}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-mono">{ticket.created_at}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        ticket.priority === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : (ticket.priority === 'HIGH' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700')
                      }`}>
                        {ticket.priority} Priority
                      </span>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        isResolved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{ticket.station_name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{ticket.station_id}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Component:</span>
                        <strong className="text-slate-800">{ticket.sensor}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sensor Health:</span>
                        <strong className="font-mono text-cyan-700">{ticket.health}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Drift Condition:</span>
                        <strong className="text-amber-700">{ticket.drift_status}</strong>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 pt-1">
                      <span className="font-semibold text-slate-700">Recommended Action: </span>
                      <span>{ticket.recommended_action}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: View Station, Schedule Dispatch, Mark Resolved */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectStation(ticket.station_id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <span>View Station</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    {ticket.status !== 'Scheduled' && !isResolved && (
                      <button
                        onClick={() => handleStatusChange(ticket.id, 'Scheduled')}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Schedule Dispatch</span>
                      </button>
                    )}

                    {!isResolved && (
                      <button
                        onClick={() => handleStatusChange(ticket.id, 'Resolved')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
