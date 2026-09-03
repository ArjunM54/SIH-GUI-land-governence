/* =========================================================
   LANDGOV GIS
   AUTH SESSION & ROUTE GUARD SERVICE (JWT & CLIENT STATE)

   Manages JWT auth tokens in client storage, user state,
   and page protection redirects.
   ========================================================= */

const STORAGE_KEY_USER = "landgov_user_profile";
const STORAGE_KEY_TOKEN = "landgov_jwt_token";

const AuthManager = {
    getUser: function () {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY_USER) || localStorage.getItem(STORAGE_KEY_USER);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    getToken: function () {
        return sessionStorage.getItem(STORAGE_KEY_TOKEN) || localStorage.getItem(STORAGE_KEY_TOKEN) || "";
    },

    setUserSession: function (user, token) {
        if (!user) return;
        const normalizedRole = (user.role || "citizen").toLowerCase();
        const userObj = {
            ...user,
            role: normalizedRole
        };
        sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userObj));
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userObj));
        if (token) {
            sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
            localStorage.setItem(STORAGE_KEY_TOKEN, token);
        }
    },

    clearSession: function () {
        sessionStorage.removeItem(STORAGE_KEY_USER);
        sessionStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_TOKEN);
    },

    isLoggedIn: function () {
        return !!this.getUser() && !!this.getToken();
    },

    /**
     * Redirects to proper dashboard depending on user role
     */
    redirectToDashboard: function (user) {
        const currentUser = user || this.getUser();
        if (!currentUser) {
            window.location.href = "login.html";
            return;
        }

        const role = (currentUser.role || "").toLowerCase();
        if (role === "admin") {
            window.location.href = "admin-dashboard.html";
        } else if (role === "officer") {
            window.location.href = "officer-dashboard.html";
        } else {
            window.location.href = "citizen-dashboard.html";
        }
    },

    /**
     * Enforces page access rules
     */
    enforcePageAccess: function (expectedRole) {
        const user = this.getUser();

        if (!user || !this.getToken()) {
            window.location.href = "login.html";
            return null;
        }

        const role = (user.role || "").toLowerCase();
        const targetRole = (expectedRole || "").toLowerCase();

        if (targetRole && role !== targetRole && role !== "admin") {
            console.warn(`Unauthorized access to ${expectedRole} page by user role '${role}'`);
            this.redirectToDashboard(user);
            return null;
        }

        return user;
    }
};

window.AuthManager = AuthManager;
