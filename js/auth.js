/* =========================================================
   LANDGOV GIS
   AUTH SESSION & ROUTE GUARD SERVICE

   Manages local storage auth tokens, current user state,
   and page protection redirects.
   ========================================================= */

const STORAGE_KEY_USER = "landgov_user_profile";
const STORAGE_KEY_TOKEN = "landgov_token";

const AuthManager = {
    getUser: function () {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_USER);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    getToken: function () {
        return localStorage.getItem(STORAGE_KEY_TOKEN) || "";
    },

    setUserSession: function (user, token) {
        if (!user) return;
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEY_TOKEN, token || user.email || user.officerId || user.uid);
    },

    clearSession: function () {
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_TOKEN);
    },

    isLoggedIn: function () {
        return !!this.getUser();
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

        if (currentUser.role === "admin") {
            window.location.href = "admin-dashboard.html";
        } else if (currentUser.role === "officer") {
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

        if (!user) {
            window.location.href = "login.html";
            return null;
        }

        if (expectedRole && user.role !== expectedRole && user.role !== "admin") {
            console.warn(`Unauthorized access to ${expectedRole} page by user role '${user.role}'`);
            this.redirectToDashboard(user);
            return null;
        }

        return user;
    }
};

window.AuthManager = AuthManager;
