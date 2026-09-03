# LandGov — Digital Land Governance GIS Platform

Integrated GIS-based Digital Public Infrastructure for Land Governance with **5-Officer Role-Based Authentication & Multi-Department Governance System**.

---

## 🏛️ System Architecture

```text
                                LANDGOV LOGIN (JWT Auth)
                                       │
                       ┌───────────────┼───────────────┐
                       │               │               │
                    CITIZEN        GOVERNMENT       ADMIN
                                     OFFICER
                                       │
          ┌───────────┬───────────┬─────┴─────┬───────────┬───────────┐
          │           │           │           │           │           │
      Cadastral   Land Records Registration Land Use  Property Tax Administrator
       Officer      Officer      Officer     Officer    Officer     (OFF-ADM-001)
     (OFF-CAD-001)(OFF-ROR-001) (OFF-REG-001)(OFF-LU-001)(OFF-TAX-001)
```

---

## 🔐 Phase 10 — Identity, Authentication & Access Control Architecture

Phase 10 enforces a multi-tenant authorization pipeline:

```text
AUTHENTICATED USER (JWT Bearer Token)
        ↓
authMiddleware.js (JWT Verification & Account Active Check)
        ↓
requireRole / requirePermission / requireOfficerType
        ↓
parcelAccessService.js (Parcel-Level Authorization Check)
        ↓
accessControlService.js (Role/Department Data Field Filtering)
        ↓
API RESPONSE & SECURITY AUDIT LOGGING (auditService)
```

### Access Control Matrix

| Feature / Resource | Citizen | Cadastral Officer | RoR Officer | Registration Officer | Land Use Officer | Tax Officer | Admin |
|---|---|---|---|---|---|---|---|
| **GIS Map Parcels** | Authorized Only | Assigned Parcels | Assigned Parcels | Assigned Parcels | Assigned Parcels | Assigned Parcels | All (`*`) |
| **Cadastral Data** | Limited | ✅ Full | Read | Read | Read | Read | ✅ Full |
| **RoR Ownership** | Own Parcel | Limited | ✅ Full | Read | Read | Limited | ✅ Full |
| **Registration Deeds** | Own Parcel | Limited | Limited | ✅ Full | Read | Limited | ✅ Full |
| **Land Use & Planning** | Basic | Read | Read | Read | ✅ Full | Read | ✅ Full |
| **Property Tax** | Own Parcel | Limited | Limited | Limited | Read | ✅ Full | ✅ Full |
| **Governance Checks** | Summary | Relevant | Relevant | Relevant | Full | Relevant | ✅ Full |
| **Conflict Checks** | Summary | Relevant | Relevant | Relevant | Full | Relevant | ✅ Full |
| **Documents** | Own / Public | Relevant | Relevant | Relevant | Relevant | Relevant | ✅ All |
| **Audit Trail** | Own Activity | Department | Department | Department | Department | Department | ✅ All |
| **User & Parcel Admin** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Full |

---

## 👥 User Roles & 5 Government Officer Departments

### 1. Citizen (`role = citizen`)
- Self-registration via `login.html` (automatically assigns `role = citizen`).
- Access: My Land Overview, Search Parcel, Filtered Land Profile, Application Tracking, Property Tax records, interactive GIS map.
- Parcel Access: Restricted strictly to assigned parcels (`assignedParcels`).

### 2. Five Government Officer Types (`role = officer`)

#### Officer 1: Cadastral & Survey Officer (`cadastral_officer`)
- **Officer ID**: `OFF-CAD-001` | **Department**: Cadastral & Survey Department
- **Permissions**: `cadastral.view`, `cadastral.verify`, `cadastral.update`, `parcel.view`, `parcel.verify`, `gis.view`, `gis.update`, `survey.view`, `survey.verify`

#### Officer 2: Land Records / RoR Officer (`land_records_officer`)
- **Officer ID**: `OFF-ROR-001` | **Department**: Land Records Department
- **Permissions**: `ror.view`, `ror.verify`, `ror.update`, `ownership.view`, `ownership.verify`, `ownership.update`, `mutation.view`, `mutation.verify`, `mutation.approve`

#### Officer 3: Registration Officer (`registration_officer`)
- **Officer ID**: `OFF-REG-001` | **Department**: Registration Department
- **Permissions**: `registration.view`, `registration.verify`, `registration.update`, `registration.approve`, `transfer.view`, `transfer.verify`, `transfer.approve`

#### Officer 4: Land Use & Planning Officer (`land_use_officer`)
- **Officer ID**: `OFF-LU-001` | **Department**: Land Use & Planning Department
- **Permissions**: `landuse.view`, `landuse.verify`, `landuse.update`, `landuse.approve`, `zoning.view`, `zoning.verify`, `zoning.update`, `restrictions.view`, `restrictions.verify`, `restrictions.update`, `proposal.validate`

#### Officer 5: Property Tax & Municipal Officer (`property_tax_officer`)
- **Officer ID**: `OFF-TAX-001` | **Department**: Property Tax & Municipal Department
- **Permissions**: `tax.view`, `tax.verify`, `tax.update`, `tax.approve`, `municipal.view`, `municipal.verify`, `building.view`, `building.verify`, `building.approve`

### 3. Administrator (`role = admin`)
- **Officer ID**: `OFF-ADM-001` | **Department**: Governance Administration
- **Permissions**: `*` | **Assigned Parcels**: `*`
- **Responsibilities**: Officer management (Create officer, Enable/Disable account, Edit permission matrix, Parcel assignments, Password resets), Citizen tracking, System security audit logs.

---

## ⚡ Demo Credentials & Test Accounts

| Role / Officer Type | Email / Identifier | Password | Dashboard URL |
|---|---|---|---|
| **Citizen** | `arjun@gmail.com` | `arjun` | `citizen-dashboard.html` |
| **Citizen** | `citizen@landgov.gov` | `Pass123!Dem` | `citizen-dashboard.html` |
| **1. Cadastral Officer** | `OFF-CAD-001` | `NewPass123!Demo` | `officer-dashboard.html` |
| **2. Land Records Officer** | `OFF-ROR-001` | `Pass123!Demo` | `officer-dashboard.html` |
| **3. Registration Officer** | `OFF-REG-001` | `Pass123!Demo` | `officer-dashboard.html` |
| **4. Land Use Officer** | `OFF-LU-001` | `Pass123!Demo` | `officer-dashboard.html` |
| **5. Property Tax Officer** | `OFF-TAX-001` | `Pass123!Demo` | `officer-dashboard.html` |
| **System Administrator** | `admin@landgov.gov` | `Pass123!Demo` | `admin-dashboard.html` |

---

## 🚀 Running the Project & Automated Tests

### 1. Start Express Backend
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000`*

### 2. Run Phase 10 Security Test Suite
```bash
node backend/tests/testPhase10.js
```
*Executes 30 automated security and access control tests.*

### 3. Launch Frontend
Open `login.html` or `index.html` in your web browser.

---

## 🛡️ Security Implementation
- **JWT Authentication**: Signed JWT tokens (`jsonwebtoken`) stored in client session context and passed in `Authorization: Bearer <token>`.
- **Password Hashing**: Passwords stored as `bcryptjs` hashes.
- **Parcel Access Control**: `parcelAccessService.js` enforces parcel assignments (`assignedParcels`) across all endpoints.
- **Data Field Security**: `accessControlService.js` redacts internal notes, audit IDs, and unpermitted departmental sections based on role.
- **Audit System**: Immutable logging of logins, logouts, access attempts, officer updates, and parcel assignments in `auditService.js`.
