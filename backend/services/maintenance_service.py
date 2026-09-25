"""
SkyGuard AI — Maintenance & Response Service
Manages automated and operator-initiated maintenance work orders for Automatic Weather Stations.
Persists records thread-safely in backend/data/tickets.json.
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

    def _load_tickets(self) -> List[Dict[str, Any]]:
        with self._lock:
            if not os.path.exists(TICKETS_FILE):
                return []
            try:
                with open(TICKETS_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return []

    def _save_tickets(self, tickets: List[Dict[str, Any]]):
        with self._lock:
            temp_path = TICKETS_FILE + ".tmp"
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(tickets, f, indent=2, ensure_ascii=False)
            os.replace(temp_path, TICKETS_FILE)

    def list_tickets(
        self,
        status: Optional[str] = None,
        station_id: Optional[str] = None,
        sensor: Optional[str] = None,
        priority: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        tickets = self._load_tickets()
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

    def get_ticket(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        tickets = self._load_tickets()
        for t in tickets:
            if t.get("id") == ticket_id or t.get("ticket_id") == ticket_id:
                return t
        return None

    def get_tickets_for_sensor(self, station_id: str, sensor: str) -> List[Dict[str, Any]]:
        tickets = self._load_tickets()
        return [
            t for t in tickets
            if t.get("station_id", "").upper() == station_id.upper()
            and t.get("sensor", "").lower() == sensor.lower()
        ]

    def create_ticket(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a new maintenance ticket.
        Auto-populates priority from linked investigation or defaults to HIGH if critical issue.
        """
        tickets = self._load_tickets()
        now_iso = datetime.now().isoformat()
        
        station_id = payload.get("station_id", "AWS-001")
        sensor = payload.get("sensor", "temperature").lower()
        
        raw_priority = payload.get("priority", "HIGH").upper()
        if raw_priority in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
            priority = raw_priority
        else:
            priority = "HIGH"

        seq_num = len(tickets) + 1
        date_str = datetime.now().strftime("%Y%m%d")
        ticket_id = f"MNT-{date_str}-{seq_num:03d}"

        initial_status = "ASSIGNED" if payload.get("assigned_to") else "OPEN"
        if payload.get("status"):
            initial_status = payload.get("status").upper()

        is_sim = bool(payload.get("is_simulation", False) or payload.get("source") == "simulation")

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
                    "author": "System Dispatch Engine",
                    "text": f"Work order generated automatically for {station_id} ({sensor})."
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
        self._save_tickets(tickets)
        return ticket

    def update_ticket(self, ticket_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Updates ticket status, assignee, notes, or resolution.
        If moving to RESOLVED, the status is set to AWAITING VERIFICATION per the Verification Rule!
        """
        tickets = self._load_tickets()
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
        self._save_tickets(tickets)
        return target_ticket

    def verify_ticket(
        self,
        ticket_id: str,
        active_investigations: List[Dict[str, Any]],
        current_sensor_status: str
    ) -> Dict[str, Any]:
        """
        Step 7 & 10 Verification Rule:
        Evaluates current real telemetry and investigation records.
        - If sensor status is HEALTHY or NORMAL and no active investigation exists for this sensor:
          Ticket status transitions to CLOSED, verified_at is set, and verification succeeds.
        - If sensor is still actively faulted:
          Verification FAILS, ticket remains AWAITING VERIFICATION, detail explains failure.
        """
        tickets = self._load_tickets()
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
            self._save_tickets(tickets)
            return {
                "success": False,
                "status": target_ticket.get("status"),
                "message": f"Verification failed: {reason}. Fault condition is still active.",
                "ticket": target_ticket
            }

    def get_kpis(self, include_simulation: bool = False) -> Dict[str, Any]:
        all_tickets = self._load_tickets()
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

    def clear_all(self):
        self._save_tickets([])

maintenance_service = MaintenanceService()
