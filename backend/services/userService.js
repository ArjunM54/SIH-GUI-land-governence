/* =========================================================
   LANDGOV GIS
   USER & OFFICER DATA SERVICE

   Provides in-memory & file-backed user profiles, passwords,
   officer management, role resolution, and permission matrix.
   ========================================================= */

const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../data/users.json");

// Default initial prototype accounts with stored passwords
const DEFAULT_USERS = [
    {
        uid: "uid-citizen-001",
        officerId: null,
        name: "Ramesh Sharma",
        email: "citizen@landgov.gov",
        password: "Pass123!Demo",
        role: "citizen",
        officerType: null,
        department: null,
        permissions: ["citizen.view", "citizen.request", "parcel.view"],
        status: "active",
        createdAt: "2026-01-01T10:00:00Z"
    },
    {
        uid: "uid-off-cad-001",
        officerId: "OFF-CAD-001",
        name: "Arun Survey",
        email: "cadastral@landgov.gov",
        password: "Pass123!Demo",
        role: "officer",
        officerType: "cadastral_officer",
        department: "Cadastral & Survey Department",
        permissions: [
            "cadastral.view",
            "cadastral.verify",
            "cadastral.update",
            "parcel.view",
            "parcel.verify",
            "gis.view",
            "gis.update",
            "survey.view",
            "survey.verify"
        ],
        status: "active",
        createdAt: "2026-01-01T10:00:00Z"
    },
    {
        uid: "uid-off-ror-001",
        officerId: "OFF-ROR-001",
        name: "Kumar LandRecords",
        email: "ror@landgov.gov",
        password: "Pass123!Demo",
        role: "officer",
        officerType: "land_records_officer",
        department: "Land Records Department",
        permissions: [
            "ror.view",
            "ror.verify",
            "ror.update",
            "ownership.view",
            "ownership.verify",
            "ownership.update",
            "mutation.view",
            "mutation.verify",
            "mutation.approve"
        ],
        status: "active",
        createdAt: "2026-01-01T10:00:00Z"
    },
    {
        uid: "uid-off-reg-001",
        officerId: "OFF-REG-001",
        name: "Priya Registrar",
        email: "registration@landgov.gov",
        password: "Pass123!Demo",
        role: "officer",
        officerType: "registration_officer",
        department: "Registration Department",
        permissions: [
            "registration.view",
            "registration.verify",
            "registration.update",
            "registration.approve",
            "transfer.view",
            "transfer.verify",
            "transfer.approve"
        ],
        status: "active",
        createdAt: "2026-01-01T10:00:00Z"
    },
    {
        uid: "uid-off-lu-001",
        officerId: "OFF-LU-001",
        name: "Ravi Planner",
        email: "landuse@landgov.gov",
        password: "Pass123!Demo",
        role: "officer",
        officerType: "land_use_officer",
        department: "Land Use & Planning Department",
        permissions: [
            "landuse.view",
            "landuse.verify",
            "landuse.update",
            "landuse.approve",
            "zoning.view",
            "zoning.verify",
            "zoning.update",
            "restrictions.view",
            "restrictions.verify",
            "restrictions.update"
        ],
        status: "active",
        createdAt: "2026-01-01T10:00:00Z"
    },
    {
        uid: "uid-off-tax-001",
        officerId: "OFF-TAX-001",
        name: "Meena Municipal",
        email: "tax@landgov.gov",
        password: "Pass123!Demo",
        role: "officer",
        officerType: "property_tax_officer",
        department: "Property Tax & Municipal Department",
        permissions: [
            "tax.view",
            "tax.verify",
            "tax.update",
            "tax.approve",
            "municipal.view",
            "municipal.verify",
            "building.view",
            "building.verify",
            "building.approve"
        ],
        status: "active",
        createdAt: "2026-01-01T10:00:00Z"
    },
    {
        uid: "uid-admin-001",
        officerId: "OFF-ADM-001",
        name: "System Administrator",
        email: "admin@landgov.gov",
        password: "Pass123!Demo",
        role: "admin",
        officerType: null,
        department: "Governance Administration",
        permissions: [
            "admin.all",
            "users.manage",
            "officers.manage",
            "permissions.manage",
            "audit.view",
            "system.manage"
        ],
        status: "active",
        createdAt: "2026-01-01T10:00:00Z"
    }
];

let usersStore = [];

function loadUsers() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, "utf-8");
            usersStore = JSON.parse(raw);
            // Migration: Ensure all default users have password field if loaded from file
            let modified = false;
            DEFAULT_USERS.forEach(defUser => {
                const existing = usersStore.find(u => u.uid === defUser.uid);
                if (existing && !existing.password) {
                    existing.password = defUser.password;
                    modified = true;
                }
            });
            if (modified) saveUsers();
        } else {
            usersStore = JSON.parse(JSON.stringify(DEFAULT_USERS));
            saveUsers();
        }
    } catch (err) {
        console.error("Error loading users store:", err);
        usersStore = JSON.parse(JSON.stringify(DEFAULT_USERS));
    }
}

function saveUsers() {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(usersStore, null, 2), "utf-8");
    } catch (err) {
        console.error("Error saving users store:", err);
    }
}

// Initial load
loadUsers();

const DEFAULT_OFFICER_PERMISSIONS = {
    cadastral_officer: [
        "cadastral.view",
        "cadastral.verify",
        "cadastral.update",
        "parcel.view",
        "parcel.verify",
        "gis.view",
        "gis.update",
        "survey.view",
        "survey.verify"
    ],
    land_records_officer: [
        "ror.view",
        "ror.verify",
        "ror.update",
        "ownership.view",
        "ownership.verify",
        "ownership.update",
        "mutation.view",
        "mutation.verify",
        "mutation.approve"
    ],
    registration_officer: [
        "registration.view",
        "registration.verify",
        "registration.update",
        "registration.approve",
        "transfer.view",
        "transfer.verify",
        "transfer.approve"
    ],
    land_use_officer: [
        "landuse.view",
        "landuse.verify",
        "landuse.update",
        "landuse.approve",
        "zoning.view",
        "zoning.verify",
        "zoning.update",
        "restrictions.view",
        "restrictions.verify",
        "restrictions.update"
    ],
    property_tax_officer: [
        "tax.view",
        "tax.verify",
        "tax.update",
        "tax.approve",
        "municipal.view",
        "municipal.verify",
        "building.view",
        "building.verify",
        "building.approve"
    ]
};

const DEPARTMENT_MAP = {
    cadastral_officer: "Cadastral & Survey Department",
    land_records_officer: "Land Records Department",
    registration_officer: "Registration Department",
    land_use_officer: "Land Use & Planning Department",
    property_tax_officer: "Property Tax & Municipal Department"
};

const OFFICER_TYPES = [
    "cadastral_officer",
    "land_records_officer",
    "registration_officer",
    "land_use_officer",
    "property_tax_officer"
];

function findUserByIdentifier(identifier) {
    if (!identifier) return null;
    loadUsers(); // Always reload fresh data from users.json file
    const term = String(identifier).trim().toLowerCase();
    return usersStore.find(
        (u) =>
            (u.email && u.email.toLowerCase() === term) ||
            (u.officerId && u.officerId.toLowerCase() === term) ||
            (u.uid && u.uid.toLowerCase() === term)
    ) || null;
}

function getUserByUid(uid) {
    if (!uid) return null;
    loadUsers(); // Always reload fresh data from users.json file
    return usersStore.find((u) => u.uid === uid) || null;
}


/**
 * Register a new citizen account with stored password
 */
function registerCitizen({ name, email, password, uid, mobile }) {
    const existing = findUserByIdentifier(email);
    if (existing) {
        throw new Error("An account with this email already exists.");
    }

    const newUser = {
        uid: uid || `uid-citizen-${Date.now()}`,
        officerId: null,
        name: name || "Citizen User",
        email: email.toLowerCase(),
        password: password || "Pass123!Demo",
        mobile: mobile || "",
        role: "citizen",
        officerType: null,
        department: null,
        permissions: ["citizen.view", "citizen.request", "parcel.view"],
        status: "active",
        createdAt: new Date().toISOString()
    };

    usersStore.push(newUser);
    saveUsers();
    return newUser;
}

/**
 * Create a new Government Officer account with stored password
 */
function createOfficer({ officerId, name, email, password, officerType, permissions, status }) {
    if (!OFFICER_TYPES.includes(officerType)) {
        throw new Error(`Invalid officer type. Must be one of: ${OFFICER_TYPES.join(", ")}`);
    }

    const existingEmail = findUserByIdentifier(email);
    if (existingEmail) {
        throw new Error("An account with this email already exists.");
    }

    const existingId = findUserByIdentifier(officerId);
    if (existingId) {
        throw new Error("An officer with this Officer ID already exists.");
    }

    const defaultPerms = DEFAULT_OFFICER_PERMISSIONS[officerType] || [];
    const assignedPermissions = Array.isArray(permissions) && permissions.length > 0 ? permissions : defaultPerms;
    const department = DEPARTMENT_MAP[officerType] || "Government Department";

    const newOfficer = {
        uid: `uid-off-${Date.now()}`,
        officerId: officerId.toUpperCase(),
        name,
        email: email.toLowerCase(),
        password: password || "Pass123!Demo",
        role: "officer",
        officerType,
        department,
        permissions: assignedPermissions,
        status: status || "active",
        createdAt: new Date().toISOString()
    };

    usersStore.push(newOfficer);
    saveUsers();
    return newOfficer;
}

/**
 * Reset / Update user password directly in file
 */
function resetUserPassword(uid, newPassword) {
    const user = getUserByUid(uid);
    if (!user) throw new Error("User not found.");
    user.password = newPassword || "Pass123!Demo";
    saveUsers();
    return user;
}

function setOfficerStatus(uid, status) {
    const user = getUserByUid(uid);
    if (!user) throw new Error("Officer not found.");
    if (user.role === "admin") throw new Error("Administrator account status cannot be altered.");
    
    user.status = status;
    saveUsers();
    return user;
}

function updateOfficerPermissions(uid, permissions) {
    const user = getUserByUid(uid);
    if (!user) throw new Error("Officer not found.");
    if (user.role === "admin") throw new Error("Admin permissions cannot be modified.");
    
    user.permissions = permissions;
    saveUsers();
    return user;
}

function listUsers(role = null) {
    if (!role) return [...usersStore];
    return usersStore.filter((u) => u.role === role);
}

module.exports = {
    DEFAULT_USERS,
    DEFAULT_OFFICER_PERMISSIONS,
    OFFICER_TYPES,
    DEPARTMENT_MAP,
    findUserByIdentifier,
    getUserByUid,
    registerCitizen,
    createOfficer,
    resetUserPassword,
    setOfficerStatus,
    updateOfficerPermissions,
    listUsers
};
