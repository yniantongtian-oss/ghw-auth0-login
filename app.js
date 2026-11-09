// Public SPA identifiers. A browser SPA has no client secret.
const AUTH0_DOMAIN = "dev-wvxvhbnjrgvgn26x.us.auth0.com";
const AUTH0_CLIENT_ID = "PdhQXfHFZsBbDq4I9LuOvvTtMSILNqPt";

const loading = document.getElementById("loading");
const error = document.getElementById("error");
const errorDetails = document.getElementById("error-details");
const app = document.getElementById("app");
const loggedOutSection = document.getElementById("logged-out");
const loggedInSection = document.getElementById("logged-in");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const profileContainer = document.getElementById("profile");
const claimsContainer = document.getElementById("claims");

const PLACEHOLDER_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='110' height='110' viewBox='0 0 110 110'%3E%3Ccircle cx='55' cy='55' r='55' fill='%2363b3ed'/%3E%3Cpath d='M55 50c8.28 0 15-6.72 15-15s-6.72-15-15-15-15 6.72-15 15 6.72 15 15 15zm0 7.5c-10 0-30 5.02-30 15v3.75c0 2.07 1.68 3.75 3.75 3.75h52.5c2.07 0 3.75-1.68 3.75-3.75V72.5c0-9.98-20-15-30-15z' fill='%23fff'/%3E%3C/svg%3E";

let auth0Client;

async function initAuth0() {
  try {
    if (!window.auth0 || typeof window.auth0.createAuth0Client !== "function") {
      throw new Error("The Auth0 SPA SDK failed to load.");
    }

    auth0Client = await window.auth0.createAuth0Client({
      domain: AUTH0_DOMAIN,
      clientId: AUTH0_CLIENT_ID,
      cacheLocation: "localstorage",
      useRefreshTokens: true,
      authorizationParams: {
        redirect_uri: window.location.origin + window.location.pathname,
      },
    });

    const params = new URLSearchParams(window.location.search);
    if ((params.has("code") || params.has("error")) && params.has("state")) {
      try {
        await auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error("Redirect callback error:", err);
        showError(err.message || "Login could not be completed.");
        return;
      }
    }

    await updateUI();
  } catch (err) {
    console.error("Auth0 initialization error:", err);
    showError(err.message || "Unable to initialize Auth0.");
  }
}

async function updateUI() {
  try {
    const isAuthenticated = await auth0Client.isAuthenticated();

    if (isAuthenticated) {
      showLoggedIn();
      await displayProfile();
    } else {
      showLoggedOut();
    }

    hideLoading();
  } catch (err) {
    console.error("UI update error:", err);
    showError(err.message || "Unable to update the page.");
  }
}

async function displayProfile() {
  const user = (await auth0Client.getUser()) || {};
  const claims = (await auth0Client.getIdTokenClaims()) || {};

  profileContainer.replaceChildren();

  const picture = document.createElement("img");
  picture.className = "profile-picture";
  picture.alt = user.name || "User";
  picture.width = 110;
  picture.height = 110;
  picture.src = user.picture || PLACEHOLDER_AVATAR;
  picture.addEventListener("error", () => {
    picture.src = PLACEHOLDER_AVATAR;
  });

  const name = document.createElement("h3");
  name.className = "profile-name";
  name.textContent = user.name || "User";

  const email = document.createElement("p");
  email.className = "profile-email";
  email.textContent = user.email || "No email provided";

  profileContainer.append(picture, name, email);

  const displayClaims = { ...claims };
  delete displayClaims.__raw;
  claimsContainer.textContent = JSON.stringify(displayClaims, null, 2);
}

async function login() {
  try {
    await auth0Client.loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin + window.location.pathname,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    showError(err.message || "Unable to start login.");
  }
}

async function logout() {
  try {
    await auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin + window.location.pathname,
      },
    });
  } catch (err) {
    console.error("Logout error:", err);
    showError(err.message || "Unable to log out.");
  }
}

function showLoading() {
  loading.style.display = "block";
  error.style.display = "none";
  app.style.display = "none";
}

function hideLoading() {
  loading.style.display = "none";
  app.style.display = "flex";
}

function showError(message) {
  loading.style.display = "none";
  app.style.display = "none";
  error.style.display = "block";
  errorDetails.textContent = message;
}

function showLoggedIn() {
  loggedOutSection.style.display = "none";
  loggedInSection.style.display = "flex";
}

function showLoggedOut() {
  loggedInSection.style.display = "none";
  loggedOutSection.style.display = "flex";
}

loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);

initAuth0();
