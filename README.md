# LandGov — Digital Land Governance GIS Platform

Integrated GIS-based Digital Public Infrastructure for Land Governance with **5-Officer Role-Based Authentication & Multi-Department Governance System**.

---

## 🏛️ System Architecture

```text
                                LANDGOV LOGIN
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

## 👥 User Roles & 5 Government Officer Departments

### 1. Citizen (`role = citizen`)
- Self-registration via `login.html` (public registration automatically assigns `role = citizen`).
- Access: My Land Overview, Search Parcel, Land Profile, Application Tracking, Property Tax records, interactive GIS map.

### 2. Five Government Officer Types (`role = officer`)

#### Officer 1: Cadastral & Survey Officer (`cadastral_officer`)
- **Officer ID**: `OFF-CAD-001` | **Department**: Cadastral & Survey Department
- **Responsibilities**: Cadastral maps, survey numbers, GIS parcel boundaries, boundary verification.
- **Permissions**: `cadastral.view`, `cadastral.verify`, `cadastral.update`, `parcel.view`, `parcel.verify`, `gis.view`, `gis.update`, `survey.view`, `survey.verify`

#### Officer 2: Land Records / RoR Officer (`land_records_officer`)
- **Officer ID**: `OFF-ROR-001` | **Department**: Land Records Department
- **Responsibilities**: Record of Rights (RoR), ownership records, tenancy, mutation request approvals.
- **Permissions**: `ror.view`, `ror.verify`, `ror.update`, `ownership.view`, `ownership.verify`, `ownership.update`, `mutation.view`, `mutation.verify`, `mutation.approve`

#### Officer 3: Registration Officer (`registration_officer`)
- **Officer ID**: `OFF-REG-001` | **Department**: Registration Department
- **Responsibilities**: Property registration, transfer requests, document verification.
- **Permissions**: `registration.view`, `registration.verify`, `registration.update`, `registration.approve`, `transfer.view`, `transfer.verify`, `transfer.approve`

#### Officer 4: Land Use & Planning Officer (`land_use_officer`)
- **Officer ID**: `OFF-LU-001` | **Department**: Land Use & Planning Department
- **Responsibilities**: Land classification, zoning, land-use conversion requests, planning restrictions.
- **Permissions**: `landuse.view`, `landuse.verify`, `landuse.update`, `landuse.approve`, `zoning.view`, `zoning.verify`, `zoning.update`, `restrictions.view`, `restrictions.verify`, `restrictions.update`

#### Officer 5: Property Tax & Municipal Officer (`property_tax_officer`)
- **Officer ID**: `OFF-TAX-001` | **Department**: Property Tax & Municipal Department
- **Responsibilities**: Property tax records, outstanding tax, building permissions, municipal records.
- **Permissions**: `tax.view`, `tax.verify`, `tax.update`, `tax.approve`, `municipal.view`, `municipal.verify`, `building.view`, `building.verify`, `building.approve`

### 3. Administrator (`role = admin`)
- **Officer ID**: `OFF-ADM-001` | **Department**: Governance Administration
- **Responsibilities**: Officer management (Create officer of 5 allowed types, Enable/Disable account, Edit permission matrix, Trigger secure password reset), Citizen tracking, System security audit logs.
- **Security Rule**: Administrator cannot view raw officer passwords or escalate own role.

---

## ⚡ Prototype Pre-configured Accounts (Instant Test Credentials)

For rapid prototype testing, click any of the **Quick-Fill buttons** on `login.html`:

| Role / Officer Type | Identifier | Password | Dashboard URL |
|---|---|---|---|
| **Citizen** | `citizen@landgov.gov` | `Pass123!Demo` | `citizen-dashboard.html` |
| **1. Cadastral Officer** | `OFF-CAD-001` | `Pass123!Demo` | `officer-dashboard.html` |
| **2. Land Records Officer** | `OFF-ROR-001` | `Pass123!Demo` | `officer-dashboard.html` |
| **3. Registration Officer** | `OFF-REG-001` | `Pass123!Demo` | `officer-dashboard.html` |
| **4. Land Use Officer** | `OFF-LU-001` | `Pass123!Demo` | `officer-dashboard.html` |
| **5. Property Tax Officer** | `OFF-TAX-001` | `Pass123!Demo` | `officer-dashboard.html` |
| **System Administrator** | `admin@landgov.gov` | `Pass123!Demo` | `admin-dashboard.html` |

---

## 🚀 Running the Project

### 1. Start Express Backend
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000`*

### 2. Launch Frontend
Open `index.html` or `login.html` in your web browser (or serve via Live Server / standard web server).

---

## 🛡️ Backend Security Architecture
- **Authorization**: Validates `Authorization: Bearer <token>` on all protected API routes via `authMiddleware.js`.
- **RBAC Enforcement**: `permissionMiddleware.js` verifies role (`requireRole`) and permissions (`requirePermission`), returning `403 Forbidden` if unauthorized.
- **Audit System**: All logins, logouts, officer creation, permission changes, password resets, and verification actions are immutably logged in `auditService.js`.
