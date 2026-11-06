# Append to models/__init__.py (keep your existing user import):
from models.route import Route, RouteStop               # noqa: F401
from models.schedule import Schedule, ScheduleOverride  # noqa: F401
from models.vehicle import Vehicle, VehicleLocation     # noqa: F401
from models.route_run import RouteRun, StopVisit        # noqa: F401
from models.user import User                            # noqa: F401
from models.citizen_bin_status import CitizenBinStatus  # noqa: F401
from models.complaint import Complaint                  # noqa: F401
from models.complaint_update import ComplaintUpdate     # noqa: F401
from models.disposal_point import DisposalPoint         # noqa: F401
from models.festival_event import FestivalEvent          # noqa: F401
from models.notification import Notification             # noqa: F401
from models.violation import Violation                   # noqa: F401
from models.waste_facility import WasteFacility          # noqa: F401
