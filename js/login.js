/* =========================================================
   LANDGOV GIS
   LOGIN & REGISTRATION UI LOGIC
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

    alertBox.style.display = "none";

    if (tab === "login") {
        loginForm.style.display = "block";
        regForm.style.display = "none";
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
    } else {
        loginForm.style.display = "none";
        regForm.style.display = "block";
        tabRegister.classList.add("active");
        tabLogin.classList.remove("active");
    }
}

function showAlert(message, type = "error") {
    const alertBox = document.getElementById("alert-box");
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
        if (response.success && response.user) {
            showAlert("Login successful! Redirecting...", "success");
            window.AuthManager.setUserSession(response.user, response.user.email || response.user.officerId);
            setTimeout(() => {
                window.AuthManager.redirectToDashboard(response.user);
            }, 600);
        } else {
            showAlert(response.error || "Login failed.", "error");
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

        if (response.success) {
            showAlert("Registration successful! Logging you in...", "success");
            window.AuthManager.setUserSession(response.user, response.user.email);
            setTimeout(() => {
                window.AuthManager.redirectToDashboard(response.user);
            }, 800);
        } else {
            showAlert(response.error || "Registration failed.", "error");
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
