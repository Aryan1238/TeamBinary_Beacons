import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import type { MaintenanceTicket, DashboardTab } from '../../types/dashboard.types';
import { MOCK_MAINTENANCE_TICKETS } from '../../data/mockStations';

interface ResponseMaintenancePageProps {
  onNavigateTab?: (tab: DashboardTab) => void;
}

export const ResponseMaintenancePage: React.FC<ResponseMaintenancePageProps> = ({
  onNavigateTab: _onNavigateTab,
}) => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(MOCK_MAINTENANCE_TICKETS);
  const [filter, setFilter] = useState<string>('ALL');

  const updateTicketStatus = (ticketId: string, newStatus: MaintenanceTicket['status']) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );
  };

  const filteredTickets = filter === 'ALL'
    ? tickets
    : tickets.filter((t) => t.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Maintenance & Response Operations"
        subtitle="Automated dispatch orders, field engineer assignments, and sensor repair logs."
        badge="OPERATIONS DISPATCH"
      />

      {/* Ticket Stats with Semantic Coloring */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#24131b]/80 via-[#161224]/80 to-[#090e1c]/95 border border-rose-500/35 backdrop-blur-md shadow-xl">
          <span className="text-xs text-rose-300 font-mono font-medium block">Pending Dispatch</span>
          <div className="text-2xl font-black font-mono text-rose-400 mt-1">
            {tickets.filter((t) => t.status === 'Pending Dispatch').length}
          </div>
          <span className="text-[10px] text-rose-400/80 font-mono">Awaiting technician assignment</span>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#231b12]/80 via-[#161324]/80 to-[#090e1c]/95 border border-amber-500/35 backdrop-blur-md shadow-xl">
          <span className="text-xs text-amber-300 font-mono font-medium block">In Progress (Field)</span>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">
            {tickets.filter((t) => t.status === 'In Progress').length}
          </div>
          <span className="text-[10px] text-amber-400/80 font-mono">Technicians en route / on-site</span>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#102422]/80 via-[#0e172a]/85 to-[#090e1c]/95 border border-emerald-500/30 backdrop-blur-md shadow-xl">
          <span className="text-xs text-emerald-300 font-mono font-medium block">Resolved (Last 24h)</span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {tickets.filter((t) => t.status === 'Resolved').length}
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">Recalibration verified</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 font-mono font-semibold uppercase tracking-wider">Status:</span>
          {(['ALL', 'Pending Dispatch', 'In Progress', 'Resolved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all ${
                filter === st
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                  : 'text-slate-400 hover:text-white bg-[#0a101f]/70 border border-slate-800/80'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <strong className="text-sky-300">{filteredTickets.length}</strong> work orders
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden"
          >
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                ticket.priority === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/35 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                  : ticket.priority === 'HIGH'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/35 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                  : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              }`}>
                <Wrench className="w-5 h-5" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-slate-300">{ticket.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border font-mono ${
                    ticket.priority === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(251,191,36,0.2)]'
                  }`}>
                    {ticket.priority}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 text-sky-300 border border-slate-700 font-mono uppercase">
                    {ticket.sensor}
                  </span>
                  <span className="text-xs text-slate-400">• {ticket.stationName} ({ticket.stationId})</span>
                </div>

                <h4 className="text-sm font-bold text-white tracking-tight">{ticket.issue}</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  <strong className="text-sky-300">Action Required:</strong> {ticket.recommendedAction}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-slate-400 font-mono">
                  {ticket.assignedTo && (
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      <span>{ticket.assignedTo}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reported {ticket.reportedAt}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Change Buttons with Glow */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              {ticket.status === 'Pending Dispatch' && (
                <button
                  onClick={() => updateTicketStatus(ticket.id, 'In Progress')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(251,191,36,0.2)] transition-all"
                >
                  Dispatch Crew
                </button>
              )}

              {ticket.status === 'In Progress' && (
                <button
                  onClick={() => updateTicketStatus(ticket.id, 'Resolved')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(52,211,153,0.2)] transition-all"
                >
                  Mark Resolved
                </button>
              )}

              {ticket.status === 'Resolved' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Closed &amp; Verified</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
