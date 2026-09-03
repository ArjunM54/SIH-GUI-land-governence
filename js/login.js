/* =========================================================
   LANDGOV GIS
   LOGIN & REGISTRATION UI LOGIC (JWT INTEGRATED)
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    // If already logged in, redirect to dashboard
    if (window.AuthManager && window.AuthManager.isLoggedIn()) {
        window.AuthManager.redirectToDashboard();
    }
});

function switchAuthTab(tab) {
    const loginForm = document.getElementById("login-form");
    const regForm = document.getElementById("register-form");
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const alertBox = document.getElementById("alert-box");

    if (alertBox) alertBox.style.display = "none";

    if (tab === "login") {
        if (loginForm) loginForm.style.display = "block";
        if (regForm) regForm.style.display = "none";
        if (tabLogin) tabLogin.classList.add("active");
        if (tabRegister) tabRegister.classList.remove("active");
    } else {
        if (loginForm) loginForm.style.display = "none";
        if (regForm) regForm.style.display = "block";
        if (tabRegister) tabRegister.classList.add("active");
        if (tabLogin) tabLogin.classList.remove("active");
    }
}

function showAlert(message, type = "error") {
    const alertBox = document.getElementById("alert-box");
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.className = `alert-message alert-${type}`;
    alertBox.style.display = "block";
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const identifier = document.getElementById("login-identifier").value.trim();
    const password = document.getElementById("login-password").value;

    try {
        const response = await window.loginUser(identifier, password);
        if (response.success && response.user && response.token) {
            showAlert("Login successful! Redirecting...", "success");
            window.AuthManager.setUserSession(response.user, response.token);
            setTimeout(() => {
                window.AuthManager.redirectToDashboard(response.user);
            }, 600);
        } else {
            showAlert(response.message || response.error || "Login failed.", "error");
        }
    } catch (err) {
        showAlert(err.message || "Unable to reach server. Please check backend status.", "error");
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const mobile = document.getElementById("reg-mobile").value.trim();
    const password = document.getElementById("reg-password").value;
    const confirmPassword = document.getElementById("reg-confirm-password").value;

    if (password !== confirmPassword) {
        showAlert("Password and Confirm Password do not match.", "error");
        return;
    }

    try {
        const response = await window.registerCitizen({
            name,
            email,
            mobile,
            password,
            confirmPassword
        });

        if (response.success && response.token) {
            showAlert("Registration successful! Logging you in...", "success");
            window.AuthManager.setUserSession(response.user, response.token);
            setTimeout(() => {
                window.AuthManager.redirectToDashboard(response.user);
            }, 800);
        } else {
            showAlert(response.message || response.error || "Registration failed.", "error");
        }
    } catch (err) {
        showAlert(err.message || "Registration failed.", "error");
    }
}

function quickFill(identifier) {
    switchAuthTab("login");
    document.getElementById("login-identifier").value = identifier;
    document.getElementById("login-password").value = "Pass123!Demo";
    showAlert(`Quick-filled prototype account for '${identifier}'. Click Log In to proceed.`, "success");
}

window.switchAuthTab = switchAuthTab;
window.handleLoginSubmit = handleLoginSubmit;
window.handleRegisterSubmit = handleRegisterSubmit;
window.quickFill = quickFill;
