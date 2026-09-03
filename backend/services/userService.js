/* =========================================================
   LANDGOV GIS
   USER & OFFICER DATA SERVICE (PHASE 10 AUTH & RBAC)

   Provides file-backed user management, bcrypt password hashing,
   JWT token generation & verification, role & permission resolution,
   and parcel-level assignments.
   ========================================================= */

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authConfig = require("../config/authConfig");

const DATA_FILE = path.join(__dirname, "../data/users.json");

// Initial demo accounts with assigned parcels
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
        assignedParcels: ["LND-001", "LND-003"],
        status: "active",
        createdAt: "2026-01-01T10:00:00Z"
    },
    {
        uid: "uid-off-cad-001",
        officerId: "OFF-CAD-001",
        name: "Arun Survey",
        email: "cadastral@landgov.gov",
        password: "NewPass123!Demo",
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
        assignedParcels: ["LND-001", "LND-002", "LND-003"],
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
        assignedParcels: ["LND-001", "LND-002"],
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
        assignedParcels: ["LND-001", "LND-003"],
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
            "restrictions.update",
            "proposal.validate"
        ],
        assignedParcels: ["LND-001", "LND-002", "LND-003"],
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
        assignedParcels: ["LND-001", "LND-002"],
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
        permissions: ["*"],
        assignedParcels: ["*"],
        status: "active",
        createdAt: "2026-01-01T10:00:00Z"
    }
];

let usersStore = [];

function normalizeUser(user) {
    if (!user) return null;
    return {
        ...user,
        active: user.status === "active",
        assignedParcels: Array.isArray(user.assignedParcels) && user.assignedParcels.length > 0
            ? user.assignedParcels
            : (user.role === "admin" ? ["*"] : (user.role === "officer" ? ["LND-001", "LND-002", "LND-003"] : ["LND-001", "LND-003"]))
    };
}

function loadUsers() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, "utf-8");
            usersStore = JSON.parse(raw);
            let modified = false;

            usersStore.forEach(u => {
                // Ensure assignedParcels exists
                if (!u.assignedParcels) {
                    if (u.role === "admin") u.assignedParcels = ["*"];
                    else if (u.role === "officer") u.assignedParcels = ["LND-001", "LND-002", "LND-003"];
                    else u.assignedParcels = ["LND-001", "LND-003"];
                    modified = true;
                }

                // Password hashing migration
                if (u.password && !u.passwordHash) {
                    u.passwordHash = bcrypt.hashSync(u.password, authConfig.SALT_ROUNDS);
                    modified = true;
                }
            });

            if (modified) saveUsers();
        } else {
            usersStore = JSON.parse(JSON.stringify(DEFAULT_USERS));
            usersStore.forEach(u => {
                u.passwordHash = bcrypt.hashSync(u.password, authConfig.SALT_ROUNDS);
            });
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
        "restrictions.update",
        "proposal.validate"
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
    loadUsers();
    const term = String(identifier).trim().toLowerCase();
    const raw = usersStore.find(
        (u) =>
            (u.email && u.email.toLowerCase() === term) ||
            (u.officerId && u.officerId.toLowerCase() === term) ||
            (u.uid && u.uid.toLowerCase() === term)
    );
    return normalizeUser(raw);
}

function getUserByUid(uid) {
    if (!uid) return null;
    loadUsers();
    const raw = usersStore.find((u) => u.uid === uid);
    return normalizeUser(raw);
}

/**
 * Validates password using bcrypt (with fallback for legacy plain-text during migration)
 */
function verifyPassword(inputPassword, user) {
    if (!inputPassword || !user) return false;
    if (user.passwordHash) {
        return bcrypt.compareSync(inputPassword, user.passwordHash);
    }
    if (user.password) {
        return inputPassword === user.password;
    }
    return false;
}

/**
 * Generates a signed JWT token for an authenticated user
 */
function generateToken(user) {
    if (!user) return null;
    const payload = {
        uid: user.uid,
        email: user.email,
        officerId: user.officerId,
        role: user.role,
        officerType: user.officerType,
        assignedParcels: user.assignedParcels || []
    };
    return jwt.sign(payload, authConfig.JWT_SECRET, { expiresIn: authConfig.JWT_EXPIRES_IN });
}

/**
 * Verifies and decodes a JWT token
 */
function verifyToken(token) {
    try {
        if (!token) return null;
        const decoded = jwt.verify(token, authConfig.JWT_SECRET);
        return decoded;
    } catch (err) {
        return null;
    }
}

/**
 * Register a new citizen account
 */
function registerCitizen({ name, email, password, uid, mobile, assignedParcels }) {
    const existing = findUserByIdentifier(email);
    if (existing) {
        throw new Error("An account with this email already exists.");
    }

    const salt = bcrypt.genSaltSync(authConfig.SALT_ROUNDS);
    const passwordHash = bcrypt.hashSync(password || "Pass123!Demo", salt);

    const newUser = {
        uid: uid || `uid-citizen-${Date.now()}`,
        officerId: null,
        name: name || "Citizen User",
        email: email.toLowerCase(),
        password: password || "Pass123!Demo",
        passwordHash,
        mobile: mobile || "",
        role: "citizen",
        officerType: null,
        department: null,
        permissions: ["citizen.view", "citizen.request", "parcel.view"],
        assignedParcels: Array.isArray(assignedParcels) && assignedParcels.length > 0 ? assignedParcels : ["LND-001", "LND-003"],
        status: "active",
        createdAt: new Date().toISOString()
    };

    usersStore.push(newUser);
    saveUsers();
    return normalizeUser(newUser);
}

/**
 * Create a new Government Officer account
 */
function createOfficer({ officerId, name, email, password, officerType, permissions, assignedParcels, status }) {
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

    const salt = bcrypt.genSaltSync(authConfig.SALT_ROUNDS);
    const passwordHash = bcrypt.hashSync(password || "Pass123!Demo", salt);

    const newOfficer = {
        uid: `uid-off-${Date.now()}`,
        officerId: officerId.toUpperCase(),
        name,
        email: email.toLowerCase(),
        password: password || "Pass123!Demo",
        passwordHash,
        role: "officer",
        officerType,
        department,
        permissions: assignedPermissions,
        assignedParcels: Array.isArray(assignedParcels) && assignedParcels.length > 0 ? assignedParcels : ["LND-001", "LND-002", "LND-003"],
        status: status || "active",
        createdAt: new Date().toISOString()
    };

    usersStore.push(newOfficer);
    saveUsers();
    return normalizeUser(newOfficer);
}

/**
 * Reset / Update user password
 */
function resetUserPassword(uid, newPassword) {
    const raw = usersStore.find((u) => u.uid === uid);
    if (!raw) throw new Error("User not found.");
    raw.password = newPassword || "Pass123!Demo";
    raw.passwordHash = bcrypt.hashSync(raw.password, authConfig.SALT_ROUNDS);
    saveUsers();
    return normalizeUser(raw);
}

function setOfficerStatus(uid, status) {
    const raw = usersStore.find((u) => u.uid === uid);
    if (!raw) throw new Error("Officer not found.");
    if (raw.role === "admin") throw new Error("Administrator account status cannot be altered.");
    
    raw.status = status;
    saveUsers();
    return normalizeUser(raw);
}

function updateOfficerPermissions(uid, permissions) {
    const raw = usersStore.find((u) => u.uid === uid);
    if (!raw) throw new Error("Officer not found.");
    if (raw.role === "admin") throw new Error("Admin permissions cannot be modified.");
    
    raw.permissions = permissions;
    saveUsers();
    return normalizeUser(raw);
}

function assignParcelsToUser(uid, assignedParcels) {
    const raw = usersStore.find((u) => u.uid === uid);
    if (!raw) throw new Error("User not found.");
    raw.assignedParcels = Array.isArray(assignedParcels) ? assignedParcels : [];
    saveUsers();
    return normalizeUser(raw);
}

function listUsers(role = null) {
    loadUsers();
    const list = role ? usersStore.filter((u) => u.role === role) : usersStore;
    return list.map(u => normalizeUser(u));
}

module.exports = {
    DEFAULT_USERS,
    DEFAULT_OFFICER_PERMISSIONS,
    OFFICER_TYPES,
    DEPARTMENT_MAP,
    findUserByIdentifier,
    getUserByUid,
    verifyPassword,
    generateToken,
    verifyToken,
    registerCitizen,
    createOfficer,
    resetUserPassword,
    setOfficerStatus,
    updateOfficerPermissions,
    assignParcelsToUser,
    listUsers
};
