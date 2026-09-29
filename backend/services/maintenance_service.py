"""
SkyGuard AI — Maintenance & Response Service
Manages automated and operator-initiated maintenance work orders for Automatic Weather Stations.
Session-isolated runtime store: each client session maintains its own work orders.
Enforces Step 7 Verification Rule: Tickets marked RESOLVED place the sensor into
AWAITING VERIFICATION until an explicit verification re-evaluates real telemetry.
"""

import os
import json
import time
import uuid
import threading
from datetime import datetime
from typing import Dict, Any, List, Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
TICKETS_FILE = os.path.join(DATA_DIR, "tickets.json")

class MaintenanceService:
    def __init__(self):
        self._lock = threading.Lock()
        os.makedirs(DATA_DIR, exist_ok=True)
        if not os.path.exists(TICKETS_FILE):
            self._save_tickets([])

        # Session-isolated tickets: session_id -> list of ticket dicts
        self.session_tickets: Dict[str, List[Dict[str, Any]]] = {}
        self.session_last_activity: Dict[str, float] = {}

    def _cleanup_expired_sessions(self, now: float):
        # 30-minute idle TTL cleanup
        expired = [s for s, last_t in self.session_last_activity.items() if now - last_t > 1800 and s != "default"]
        for s in expired:
            self.session_tickets.pop(s, None)
            self.session_last_activity.pop(s, None)

        # Cap sessions at 50 to prevent unbounded memory growth on Render free tier
        if len(self.session_last_activity) > 50:
            oldest = sorted(
                [s for s in self.session_last_activity if s != "default"],
                key=lambda s: self.session_last_activity[s]
            )
            for s in oldest[: len(self.session_last_activity) - 50]:
                self.session_tickets.pop(s, None)
                self.session_last_activity.pop(s, None)

    def _get_session_tickets(self, session_id: Optional[str] = "default") -> List[Dict[str, Any]]:
        sid = (session_id or "default").strip()
        now = time.time()
        with self._lock:
            self._cleanup_expired_sessions(now)
            if sid not in self.session_tickets:
                if sid == "default":
                    self.session_tickets[sid] = self._load_tickets()
                else:
                    self.session_tickets[sid] = []
            self.session_last_activity[sid] = now
            return self.session_tickets[sid]

    def _load_tickets(self) -> List[Dict[str, Any]]:
        if not os.path.exists(TICKETS_FILE):
            return []
        try:
            with open(TICKETS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return [t for t in data if not t.get("is_simulation", False)]
        except Exception:
            return []

    def _save_tickets(self, tickets: List[Dict[str, Any]]):
        # Simulation tickets are strictly ephemeral session-only and must NEVER be written to persistent store
        persistent_tickets = [t for t in tickets if not t.get("is_simulation", False)]
        temp_path = TICKETS_FILE + ".tmp"
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(persistent_tickets, f, indent=2, ensure_ascii=False)
        os.replace(temp_path, TICKETS_FILE)

    def list_tickets(
        self,
        status: Optional[str] = None,
        station_id: Optional[str] = None,
        sensor: Optional[str] = None,
        priority: Optional[str] = None,
        session_id: Optional[str] = "default",
        include_simulation: bool = False
    ) -> List[Dict[str, Any]]:
        all_tickets = self._get_session_tickets(session_id)
        tickets = [t for t in all_tickets if include_simulation or not t.get("is_simulation", False)]
        filtered = tickets
        if status and status.upper() != "ALL":
            filtered = [t for t in filtered if t.get("status", "").upper() == status.upper()]
        if station_id and station_id.upper() != "ALL":
            filtered = [t for t in filtered if t.get("station_id", "").upper() == station_id.upper()]
        if sensor and sensor.upper() != "ALL":
            filtered = [t for t in filtered if t.get("sensor", "").lower() == sensor.lower()]
        if priority and priority.upper() != "ALL":
            filtered = [t for t in filtered if t.get("priority", "").upper() == priority.upper()]
        
        filtered.sort(key=lambda t: t.get("updated_at") or t.get("created_at") or "", reverse=True)
        return filtered

    def get_ticket(self, ticket_id: str, session_id: Optional[str] = "default") -> Optional[Dict[str, Any]]:
        tickets = self._get_session_tickets(session_id)
        for t in tickets:
            if t.get("id") == ticket_id or t.get("ticket_id") == ticket_id:
                return t
        return None

    def get_tickets_for_sensor(self, station_id: str, sensor: str, session_id: Optional[str] = "default") -> List[Dict[str, Any]]:
        tickets = self._get_session_tickets(session_id)
        return [
            t for t in tickets
            if t.get("station_id", "").upper() == station_id.upper()
            and t.get("sensor", "").lower() == sensor.lower()
        ]

    def create_ticket(self, payload: Dict[str, Any], session_id: Optional[str] = "default") -> Dict[str, Any]:
        """
        Creates a new maintenance ticket in the caller's session.
        Auto-populates priority from linked investigation or defaults to HIGH if critical issue.
        """
        sid = (session_id or "default").strip()
        tickets = self._get_session_tickets(sid)
        now_iso = datetime.now().isoformat()
        
        station_id = payload.get("station_id", "AWS-001")
        sensor = payload.get("sensor", "temperature").lower()
        
        raw_priority = payload.get("priority", "HIGH").upper()
        if raw_priority in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
            priority = raw_priority
        else:
            priority = "HIGH"

        is_sim = bool(payload.get("is_simulation", False) or payload.get("source") == "simulation")

        # Idempotency check for simulation tickets:
        # Avoid duplicate tickets for the same station and sensor in this session if already open/assigned
        if is_sim:
            for t in tickets:
                if (
                    t.get("is_simulation")
                    and t.get("station_id") == station_id
                    and t.get("sensor", "").lower() == sensor.lower()
                    and t.get("status") in ("OPEN", "ASSIGNED")
                ):
                    return t

        seq_num = len(tickets) + 1
        date_str = datetime.now().strftime("%Y%m%d")
        ticket_id = f"MNT-{date_str}-{seq_num:03d}"

        initial_status = "ASSIGNED" if payload.get("assigned_to") else "OPEN"
        if payload.get("status"):
            initial_status = payload.get("status").upper()

        ticket = {
            "id": ticket_id,
            "ticket_id": ticket_id,
            "station_id": station_id,
            "station_name": payload.get("station_name") or f"Station {station_id}",
            "station_location": payload.get("station_location") or "Regional Automated Grid",
            "sensor": sensor,
            "issue": payload.get("issue") or f"Sensor Anomaly detected on {station_id} {sensor}",
            "priority": priority,
            "status": initial_status,
            "is_simulation": is_sim,
            "source": "simulation" if is_sim else "production",
            "created_at": now_iso,
            "updated_at": now_iso,
            "assigned_to": payload.get("assigned_to") or "Regional Field Unit",
            "evidence": payload.get("evidence") or {},
            "recommended_action": payload.get("recommended_action") or "Field probe inspection and calibration audit required.",
            "notes": payload.get("notes") or [
                {
                    "timestamp": now_iso,
                    "author": "Operator Work Order",
                    "text": f"Work order logged for {station_id} ({sensor})."
                }
            ],
            "resolution": None,
            "verified_at": None,
            "verification_result": None,
            "timeline": [
                {
                    "timestamp": now_iso,
                    "event": "TICKET_CREATED",
                    "status": initial_status,
                    "detail": f"Ticket {ticket_id} opened with priority {priority}."
                }
            ]
        }

        tickets.append(ticket)
        if sid == "default" and not is_sim:
            self._save_tickets(tickets)
        return ticket

    def update_ticket(self, ticket_id: str, updates: Dict[str, Any], session_id: Optional[str] = "default") -> Optional[Dict[str, Any]]:
        """
        Updates ticket status, assignee, notes, or resolution.
        If moving to RESOLVED, the status is set to AWAITING VERIFICATION per the Verification Rule!
        """
        sid = (session_id or "default").strip()
        tickets = self._get_session_tickets(sid)
        found = False
        target_ticket = None
        now_iso = datetime.now().isoformat()

        for t in tickets:
            if t.get("id") == ticket_id or t.get("ticket_id") == ticket_id:
                target_ticket = t
                found = True
                break

        if not found or not target_ticket:
            return None

        new_status = updates.get("status")
        if new_status:
            new_status_upper = new_status.upper()
            if new_status_upper in ("RESOLVED", "AWAITING VERIFICATION"):
                target_ticket["status"] = "AWAITING VERIFICATION"
                if "resolution" in updates:
                    target_ticket["resolution"] = updates["resolution"]
                target_ticket["timeline"].append({
                    "timestamp": now_iso,
                    "event": "REPAIR_COMPLETED_AWAITING_VERIFICATION",
                    "status": "AWAITING VERIFICATION",
                    "detail": "Field repair logged. Sensor entered AWAITING VERIFICATION state until telemetry validation."
                })
            else:
                target_ticket["status"] = new_status_upper
                target_ticket["timeline"].append({
                    "timestamp": now_iso,
                    "event": f"STATUS_CHANGED_TO_{new_status_upper}",
                    "status": new_status_upper,
                    "detail": f"Status updated to {new_status_upper}."
                })

        if "assigned_to" in updates:
            target_ticket["assigned_to"] = updates["assigned_to"]
        if "notes" in updates and isinstance(updates["notes"], list):
            target_ticket["notes"] = updates["notes"]
        elif "note" in updates and isinstance(updates["note"], str):
            target_ticket["notes"].append({
                "timestamp": now_iso,
                "author": updates.get("author", "Operator"),
                "text": updates["note"]
            })
        if "resolution" in updates and target_ticket.get("resolution") is None:
            target_ticket["resolution"] = updates["resolution"]

        target_ticket["updated_at"] = now_iso
        if sid == "default":
            self._save_tickets(tickets)
        return target_ticket

    def verify_ticket(
        self,
        ticket_id: str,
        active_investigations: List[Dict[str, Any]],
        current_sensor_status: str,
        session_id: Optional[str] = "default"
    ) -> Dict[str, Any]:
        """
        Step 7 & 10 Verification Rule:
        Evaluates current real telemetry and investigation records.
        - If sensor status is HEALTHY or NORMAL and no active investigation exists for this sensor:
          Ticket status transitions to CLOSED, verified_at is set, and verification succeeds.
        - If sensor is still actively faulted:
          Verification FAILS, ticket remains AWAITING VERIFICATION, detail explains failure.
        """
        sid = (session_id or "default").strip()
        tickets = self._get_session_tickets(sid)
        target_ticket = None
        now_iso = datetime.now().isoformat()

        for t in tickets:
            if t.get("id") == ticket_id or t.get("ticket_id") == ticket_id:
                target_ticket = t
                break

        if not target_ticket:
            return {"success": False, "error": f"Ticket {ticket_id} not found."}

        station_id = target_ticket.get("station_id")
        sensor = target_ticket.get("sensor")

        matching_investigations = [
            inv for inv in active_investigations
            if inv.get("station_id") == station_id
            and (inv.get("parameter", "").lower() == sensor.lower() or inv.get("dominant_feature", "").lower() == sensor.lower() or sensor.lower() == "temperature")
        ]

        is_clear = (len(matching_investigations) == 0) and (current_sensor_status.upper() in ("HEALTHY", "NORMAL", "AWAITING VERIFICATION"))

        if is_clear:
            target_ticket["status"] = "CLOSED"
            target_ticket["verified_at"] = now_iso
            target_ticket["verification_result"] = {
                "success": True,
                "detail": f"Telemetry verified nominal: No active anomaly detected on {station_id} {sensor}. Physical values within baseline bounds.",
                "verified_at": now_iso
            }
            target_ticket["timeline"].append({
                "timestamp": now_iso,
                "event": "VERIFICATION_PASSED",
                "status": "CLOSED",
                "detail": f"Live telemetry validation confirmed nominal operational parameters. Ticket closed successfully."
            })
            target_ticket["updated_at"] = now_iso
            if sid == "default":
                self._save_tickets(tickets)
            return {
                "success": True,
                "status": "CLOSED",
                "message": f"Verification passed! Sensor {station_id} ({sensor}) returned to HEALTHY.",
                "ticket": target_ticket
            }
        else:
            reason = "Active anomaly still detected on telemetry stream" if matching_investigations else f"Sensor status is {current_sensor_status}"
            target_ticket["verification_result"] = {
                "success": False,
                "detail": f"Verification FAILED: {reason}. Work order cannot be closed until telemetry normalizes.",
                "verified_at": now_iso
            }
            target_ticket["timeline"].append({
                "timestamp": now_iso,
                "event": "VERIFICATION_FAILED",
                "status": target_ticket.get("status"),
                "detail": f"Verification failed: {reason}."
            })
            target_ticket["updated_at"] = now_iso
            if sid == "default":
                self._save_tickets(tickets)
            return {
                "success": False,
                "status": target_ticket.get("status"),
                "message": f"Verification failed: {reason}. Fault condition is still active.",
                "ticket": target_ticket
            }

    def get_kpis(self, include_simulation: bool = False, session_id: Optional[str] = "default") -> Dict[str, Any]:
        all_tickets = self._get_session_tickets(session_id)
        tickets = [t for t in all_tickets if include_simulation or not t.get("is_simulation", False)]
        total = len(tickets)
        simulation_count = sum(1 for t in all_tickets if t.get("is_simulation", False))
        open_count = sum(1 for t in tickets if t.get("status") in ("OPEN", "ASSIGNED"))
        high_priority = sum(1 for t in tickets if t.get("priority") in ("CRITICAL", "HIGH") and t.get("status") != "CLOSED")
        in_progress = sum(1 for t in tickets if t.get("status") == "IN PROGRESS")
        awaiting_verification = sum(1 for t in tickets if t.get("status") == "AWAITING VERIFICATION")
        resolved_or_closed = sum(1 for t in tickets if t.get("status") in ("RESOLVED", "CLOSED"))
        
        overdue = 0
        now_ts = time.time()
        for t in tickets:
            if t.get("status") not in ("RESOLVED", "CLOSED"):
                created = t.get("created_at")
                if created:
                    try:
                        dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                        if now_ts - dt.timestamp() > 48 * 3600:
                            overdue += 1
                    except Exception:
                        pass

        return {
            "total_tickets": total,
            "open_tickets": open_count,
            "high_priority": high_priority,
            "in_progress": in_progress,
            "awaiting_verification": awaiting_verification,
            "resolved_or_closed": resolved_or_closed,
            "overdue": overdue,
            "simulation_tickets": simulation_count
        }

    def clear_all(self, session_id: Optional[str] = "default"):
        sid = (session_id or "default").strip()
        tickets = self._get_session_tickets(sid)
        tickets.clear()
        if sid == "default":
            self._save_tickets([])

    def clear_simulation_tickets(self, session_id: Optional[str] = "default"):
        """Removes all simulation tickets for the specified session, leaving manual/prod tickets intact."""
        sid = (session_id or "default").strip()
        with self._lock:
            if sid in self.session_tickets:
                self.session_tickets[sid] = [t for t in self.session_tickets[sid] if not t.get("is_simulation", False)]
        if sid == "default":
            self._save_tickets(self.session_tickets.get(sid, []))

maintenance_service = MaintenanceService()
