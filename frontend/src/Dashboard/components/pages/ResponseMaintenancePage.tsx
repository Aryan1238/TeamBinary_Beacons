import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  User,
  AlertTriangle,
  Radio,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  ShieldCheck,
  XCircle,
  X,
  FileText,
  ChevronRight
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import type {
  MaintenanceTicket,
  DashboardTab,
  MaintenanceKPIs,
  MaintenanceTicketsResponse,
  SensorType
} from '../../types/dashboard.types';

interface ResponseMaintenancePageProps {
  onNavigateTab?: (tab: DashboardTab) => void;
  onTicketUpdated?: () => void;
}

export const ResponseMaintenancePage: React.FC<ResponseMaintenancePageProps> = ({
  onNavigateTab,
  onTicketUpdated,
}) => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [kpis, setKpis] = useState<MaintenanceKPIs | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Verification alert modal / message
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    ticketId: string;
    success: boolean;
    message: string;
  } | null>(null);

  // New ticket modal
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newTicketForm, setNewTicketForm] = useState({
    station_id: 'AWS-003',
    sensor: 'temperature' as SensorType,
    issue: 'High Temperature Excursion / Probe Calibration Variance',
    priority: 'HIGH',
    assigned_to: 'Regional Field Unit (Pune)',
    recommended_action: 'Recalibrate RTD sensor, inspect aspirated shield intake.',
    note: 'Manual work order logged by control room operator.',
  });

  // Ticket Detail Drawer
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/maintenance/tickets');
      if (res.ok) {
        const data: MaintenanceTicketsResponse = await res.json();
        setTickets(data.tickets || []);
        setKpis(data.kpis || null);
      }
    } catch (err) {
      console.error('Failed to fetch maintenance tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 4000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/maintenance/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolution: newStatus === 'RESOLVED' ? 'Field repair and probe adjustment completed.' : undefined,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        fetchTickets();
        if (onTicketUpdated) onTicketUpdated();
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    }
  };

  const handleVerifyTicket = async (ticketId: string) => {
    setVerifyingId(ticketId);
    setVerificationFeedback(null);
    try {
      const res = await fetch(`/api/maintenance/tickets/${ticketId}/verify`, {
        method: 'POST',
      });
      const data = await res.json();
      setVerificationFeedback({
        ticketId,
        success: data.success,
        message: data.message || data.detail || (data.success ? 'Verification Passed!' : 'Verification Failed!'),
      });
      fetchTickets();
      if (onTicketUpdated) onTicketUpdated();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(data.ticket || null);
      }
    } catch (err) {
      console.error('Error verifying ticket:', err);
      setVerificationFeedback({
        ticketId,
        success: false,
        message: 'Network error communicating with verification engine.',
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        station_id: newTicketForm.station_id,
        sensor: newTicketForm.sensor,
        issue: newTicketForm.issue,
        priority: newTicketForm.priority,
        assigned_to: newTicketForm.assigned_to,
        recommended_action: newTicketForm.recommended_action,
        notes: [
          {
            timestamp: new Date().toISOString(),
            author: 'Control Room Operator',
            text: newTicketForm.note,
          },
        ],
      };

      const res = await fetch('/api/maintenance/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setCreateModalOpen(false);
        fetchTickets();
        if (onTicketUpdated) onTicketUpdated();
      }
    } catch (err) {
      console.error('Failed to create ticket:', err);
    }
  };

  const handleAddNote = async (ticketId: string) => {
    if (!newNoteText.trim()) return;
    try {
      const res = await fetch(`/api/maintenance/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: newNoteText.trim(),
          author: 'Operator Log',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setNewNoteText('');
        setSelectedTicket(updated);
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 font-mono">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200 font-mono">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 font-mono">
            MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 font-mono">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
      case 'PENDING DISPATCH':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200 font-mono">
            OPEN
          </span>
        );
      case 'ASSIGNED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono">
            ASSIGNED
          </span>
        );
      case 'IN PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 font-mono">
            IN PROGRESS
          </span>
        );
      case 'AWAITING VERIFICATION':
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300 font-mono animate-pulse">
            AWAITING VERIFICATION
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
            CLOSED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 font-mono">
            {status}
          </span>
        );
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const s = t.status?.toUpperCase();
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'OPEN' && !(s === 'OPEN' || s === 'PENDING DISPATCH')) return false;
      if (statusFilter === 'AWAITING VERIFICATION' && !(s === 'AWAITING VERIFICATION' || s === 'RESOLVED')) return false;
      if (statusFilter !== 'OPEN' && statusFilter !== 'AWAITING VERIFICATION' && s !== statusFilter) return false;
    }
    if (priorityFilter !== 'ALL' && t.priority?.toUpperCase() !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        t.id?.toLowerCase().includes(q) ||
        t.station_id?.toLowerCase().includes(q) ||
        t.stationId?.toLowerCase().includes(q) ||
        t.issue?.toLowerCase().includes(q) ||
        t.sensor?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Maintenance & Response Operations"
        subtitle="Automated dispatch orders, field engineer assignments, repair workflows, and post-service telemetry verification."
        badge="OPERATIONS DISPATCH"
      />

      {/* Real Live KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-mono block">Total Orders</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1">
            {kpis?.total_tickets ?? tickets.length}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">All logged tickets</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-sky-800 font-mono block">Open / Unassigned</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-sky-700 mt-1">
            {kpis?.open_tickets ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Awaiting dispatch</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-rose-800 font-mono block">High / Critical</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-700 mt-1">
            {kpis?.high_priority ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Priority response</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-amber-800 font-mono block">In Progress</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-700 mt-1">
            {kpis?.in_progress ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Technicians on-site</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-blue-800 font-mono block">Awaiting Verification</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-blue-700 mt-1">
            {kpis?.awaiting_verification ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Repaired; pending test</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-emerald-800 font-mono block">Closed / Verified</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700 mt-1">
            {kpis?.resolved_or_closed ?? 0}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Verified nominal</span>
        </div>
      </div>

      {/* Verification Feedback Banner */}
      {verificationFeedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all shadow-sm ${
            verificationFeedback.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {verificationFeedback.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider">
                Telemetry Verification {verificationFeedback.success ? 'Passed' : 'Failed'}
              </div>
              <div className="text-xs mt-0.5">{verificationFeedback.message}</div>
            </div>
          </div>
          <button
            onClick={() => setVerificationFeedback(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-700 font-mono font-semibold uppercase tracking-wider">Status:</span>
          {(['ALL', 'OPEN', 'ASSIGNED', 'IN PROGRESS', 'AWAITING VERIFICATION', 'CLOSED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-sky-50 text-sky-800 border border-sky-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticket, station..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
            />
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Work Order</span>
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-2 opacity-80" />
            <h4 className="text-slate-900 font-bold text-sm">No Matching Work Orders</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              All AWS stations and sensors are nominal. When an anomaly or sensor drift occurs, work orders can be dispatched automatically or manually.
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const stId = ticket.station_id || ticket.stationId;
            const stName = ticket.station_name || ticket.stationName;
            const currentStatus = ticket.status?.toUpperCase();

            return (
              <div
                key={ticket.id}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden group hover:border-slate-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3.5 flex-1 cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                  <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                    ticket.priority === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                      : ticket.priority === 'HIGH'
                      ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-xs'
                      : ticket.priority === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-xs'
                      : 'bg-sky-50 text-sky-700 border border-sky-200 shadow-xs'
                  }`}>
                    <Wrench className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-sky-700">{ticket.id}</span>
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono uppercase">
                        {ticket.sensor}
                      </span>
                      <span className="text-xs text-slate-500">• {stName} ({stId})</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 tracking-tight">{ticket.issue}</h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      <strong className="text-sky-800">Action:</strong> {ticket.recommended_action || ticket.recommendedAction}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-slate-500 font-mono">
                      {(ticket.assigned_to || ticket.assignedTo) && (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <User className="w-3.5 h-3.5 text-sky-600" />
                          <span>{ticket.assigned_to || ticket.assignedTo}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Logged {ticket.created_at ? new Date(ticket.created_at).toLocaleTimeString() : (ticket.reportedAt || 'Active')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workflow Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {(currentStatus === 'OPEN' || currentStatus === 'PENDING DISPATCH') && (
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, 'ASSIGNED')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 shadow-xs transition-all"
                    >
                      Assign Crew
                    </button>
                  )}

                  {currentStatus === 'ASSIGNED' && (
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, 'IN PROGRESS')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-xs transition-all"
                    >
                      Dispatch Technician
                    </button>
                  )}

                  {currentStatus === 'IN PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-xs transition-all"
                    >
                      Mark Resolved (Await Verification)
                    </button>
                  )}

                  {(currentStatus === 'AWAITING VERIFICATION' || currentStatus === 'RESOLVED') && (
                    <button
                      onClick={() => handleVerifyTicket(ticket.id)}
                      disabled={verifyingId === ticket.id}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Radio className={`w-3.5 h-3.5 text-emerald-600 ${verifyingId === ticket.id ? 'animate-spin' : 'animate-pulse'}`} />
                      <span>{verifyingId === ticket.id ? 'Evaluating Telemetry...' : 'Run Telemetry Verification'}</span>
                    </button>
                  )}

                  {currentStatus === 'CLOSED' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified &amp; Closed</span>
                    </span>
                  )}

                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ticket Detail Drawer */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500" />

            <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-700">{selectedTicket.id}</span>
                  {getPriorityBadge(selectedTicket.priority)}
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedTicket.station_name || selectedTicket.stationName} — {selectedTicket.sensor}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Station ID: {selectedTicket.station_id || selectedTicket.stationId} • Location: {selectedTicket.station_location || 'Subcontinent Grid'}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Issue Description */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-mono block mb-1">Issue Overview</span>
                <p className="text-xs text-slate-800 leading-relaxed">{selectedTicket.issue}</p>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <span className="text-[10px] text-slate-500 font-mono block mb-1">Recommended Action</span>
                  <p className="text-xs text-sky-800 font-medium">{selectedTicket.recommended_action || selectedTicket.recommendedAction}</p>
                </div>
              </div>

              {/* Status & Verification Workflow Step 7 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-900 block mb-2">Operational Action</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'ASSIGNED')}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100"
                  >
                    Set ASSIGNED
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'IN PROGRESS')}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                  >
                    Set IN PROGRESS
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'RESOLVED')}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                  >
                    Complete Repair (Awaiting Verif)
                  </button>
                  <button
                    onClick={() => handleVerifyTicket(selectedTicket.id)}
                    disabled={verifyingId === selectedTicket.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5"
                  >
                    <Radio className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Run Telemetry Verification</span>
                  </button>
                </div>
              </div>

              {/* Verification Result (if recorded) */}
              {selectedTicket.verification_result && (
                <div className={`p-3.5 rounded-xl border text-xs ${
                  selectedTicket.verification_result.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <span className="font-mono font-bold block mb-1">
                    Verification Outcome ({selectedTicket.verification_result.success ? 'PASSED' : 'FAILED'}):
                  </span>
                  <p>{selectedTicket.verification_result.detail}</p>
                </div>
              )}

              {/* Event Timeline */}
              {selectedTicket.timeline && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-mono font-bold text-slate-800 block mb-2">Work Order Lifecycle History</span>
                  <div className="space-y-2">
                    {selectedTicket.timeline.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs">
                        <span className="font-mono text-slate-500 text-[10px] shrink-0 mt-0.5">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                        <div>
                          <span className="font-mono font-semibold text-sky-700">{item.event}: </span>
                          <span className="text-slate-700">{item.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes & Audit Log */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-800 block mb-2">Operator Notes &amp; Logs</span>
                <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
                  {(selectedTicket.notes || []).map((n, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                        <span className="font-semibold text-slate-700">{n.author}</span>
                        <span>{new Date(n.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-700">{n.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add an operational note..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={() => handleAddNote(selectedTicket.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 shadow-2xs"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Work Order Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                Dispatch New Maintenance Work Order
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-mono block mb-1">Target Station</label>
                  <select
                    value={newTicketForm.station_id}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, station_id: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-sky-500"
                  >
                    <option value="AWS-001">AWS-001 (Chennai)</option>
                    <option value="AWS-002">AWS-002 (Bengaluru)</option>
                    <option value="AWS-003">AWS-003 (Pune)</option>
                    <option value="AWS-004">AWS-004 (Mumbai)</option>
                    <option value="AWS-005">AWS-005 (Kolkata)</option>
                    <option value="AWS-006">AWS-006 (Ahmedabad)</option>
                    <option value="AWS-007">AWS-007 (Hyderabad)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-mono block mb-1">Sensor Probe</label>
                  <select
                    value={newTicketForm.sensor}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, sensor: e.target.value as SensorType })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-sky-500"
                  >
                    <option value="temperature">Temperature</option>
                    <option value="humidity">Humidity</option>
                    <option value="pressure">Pressure</option>
                    <option value="wind">Wind Speed</option>
                    <option value="rainfall">Precipitation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-mono block mb-1">Priority</label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-sky-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-mono block mb-1">Assignee</label>
                  <input
                    type="text"
                    value={newTicketForm.assigned_to}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, assigned_to: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-mono block mb-1">Issue Description</label>
                <input
                  type="text"
                  value={newTicketForm.issue}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, issue: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-mono block mb-1">Recommended Action</label>
                <input
                  type="text"
                  value={newTicketForm.recommended_action}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, recommended_action: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-mono block mb-1">Initial Operator Note</label>
                <textarea
                  rows={2}
                  value={newTicketForm.note}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, note: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs"
                >
                  Dispatch Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
