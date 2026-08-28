// ============================================================
// শাহমাহমুদপুর বাজার — Supabase Configuration
// ============================================================

const SUPABASE_URL =
  "https://jeupbfoceqmnpwlklche.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldXBiZm9jZXFtbnB3bGtsY2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4Nzc4NjEsImV4cCI6MjEwMzQ1Mzg2MX0.-1NNm67t4HiB-I8fgTZcOwDHVrwmFtTH7T6DnkveXt4";


// ============================================================
// Supabase REST helper
// ============================================================

async function sbFetch(path, options = {}) {

  const headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const response = await fetch(
    SUPABASE_URL + path,
    {
      ...options,
      headers
    }
  );

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  if (!response.ok) {

    const message =
      data?.message ||
      data?.msg ||
      data?.error_description ||
      data?.error ||
      "Supabase request failed.";

    throw new Error(message);
  }

  return data;
}


// ============================================================
// Session helpers
// ============================================================

function getSbSession() {

  try {

    const raw =
      localStorage.getItem("smb_supabase_session");

    if (!raw) return null;

    const session = JSON.parse(raw);

    if (!session || !session.access_token) {
      return null;
    }

    return session;

  } catch (error) {

    console.error("Session read error:", error);

    return null;
  }
}


function setSbSession(session) {

  if (!session) return;

  try {

    localStorage.setItem(
      "smb_supabase_session",
      JSON.stringify(session)
    );

  } catch (error) {

    console.error("Session save error:", error);
  }
}


function clearSbSession() {

  localStorage.removeItem(
    "smb_supabase_session"
  );

  localStorage.removeItem(
    "smb_user_v1"
  );
}


// ============================================================
// Get current Supabase user
// ============================================================

async function getCurrentUser() {

  const session = getSbSession();

  if (!session || !session.access_token) {
    return null;
  }

  try {

    const user = await sbFetch(
      "/auth/v1/user",
      {
        headers: {
          "Authorization":
            "Bearer " + session.access_token
        }
      }
    );

    return user;

  } catch (error) {

    console.error(
      "Current user error:",
      error
    );

    return null;
  }
}


// ============================================================
// Google Login
// ============================================================

function googleLogin() {

  const redirectTo =
    "https://smbazar.cyou/";

  const url =
    SUPABASE_URL +
    "/auth/v1/authorize" +
    "?provider=google" +
    "&redirect_to=" +
    encodeURIComponent(redirectTo);

  window.location.href = url;
}


// ============================================================
// Handle Google OAuth callback
// ============================================================

async function handleAuthCallback() {

  const hash =
    window.location.hash || "";

  if (!hash.includes("access_token=")) {
    return null;
  }

  try {

    const params =
      new URLSearchParams(
        hash.replace(/^#/, "")
      );

    const accessToken =
      params.get("access_token");

    const refreshToken =
      params.get("refresh_token");

    const expiresIn =
      params.get("expires_in");

    if (!accessToken) {
      return null;
    }

    const session = {

      access_token: accessToken,

      refresh_token:
        refreshToken || "",

      expires_in:
        Number(expiresIn || 3600),

      token_type:
        params.get("token_type") || "bearer"

    };


    setSbSession(session);


    const user =
      await getCurrentUser();


    if (user) {

      const metadata =
        user.user_metadata || {};

      localStorage.setItem(
        "smb_user_v1",
        JSON.stringify({

          id: user.id || "",

          name:
            metadata.full_name ||
            metadata.name ||
            "",

          email:
            user.email || "",

          phone:
            metadata.phone || "",

          avatar:
            metadata.avatar_url ||
            metadata.picture ||
            ""

        })
      );

    }


    // URL থেকে OAuth token সরিয়ে দিচ্ছি
    history.replaceState(
      {},
      document.title,
      window.location.pathname
    );


    return user;

  } catch (error) {

    console.error(
      "OAuth callback error:",
      error
    );

    return null;
  }
}


// ============================================================
// Logout
// ============================================================

async function logout() {

  const session =
    getSbSession();

  try {

    if (session?.access_token) {

      await fetch(
        SUPABASE_URL +
        "/auth/v1/logout",
        {
          method: "POST",

          headers: {
            "apikey":
              SUPABASE_ANON_KEY,

            "Authorization":
              "Bearer " +
              session.access_token
          }
        }
      );

    }

  } catch (error) {

    console.warn(
      "Logout request failed:",
      error
    );

  } finally {

    clearSbSession();

    window.location.href =
      "index.html";
  }
}


// ============================================================
// Auth shortcut
// ============================================================

async function auth(action, payload = {}) {

  if (action === "signup") {

    return await sbFetch(
      "/auth/v1/signup",
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );

  }


  if (action === "login") {

    const data = await sbFetch(
      "/auth/v1/token?grant_type=password",
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );

    if (data) {
      setSbSession(data);
    }

    return data;
  }


  if (action === "logout") {

    await logout();

    return {
      success: true
    };
  }


  throw new Error(
    "Unknown authentication action: " +
    action
  );
}


// ============================================================
// Make functions available globally
// ============================================================

window.SUPABASE_URL =
  SUPABASE_URL;

window.SUPABASE_ANON_KEY =
  SUPABASE_ANON_KEY;

window.googleLogin =
  googleLogin;

window.getSbSession =
  getSbSession;

window.setSbSession =
  setSbSession;

window.clearSbSession =
  clearSbSession;

window.getCurrentUser =
  getCurrentUser;

window.handleAuthCallback =
  handleAuthCallback;

window.logout =
  logout;

window.auth =
  auth;

window.sbFetch =
  sbFetch;

// ============================================================
// AUTO HANDLE GOOGLE LOGIN CALLBACK
// ============================================================

(function(){

  async function initAuthCallback(){

    try{

      // Google/Supabase callback থেকে session তৈরি
      const user =
        await handleAuthCallback();

      if(user){

        console.log(
          "Google login successful:",
          user.email
        );

      }

    }catch(error){

      console.error(
        "Auth callback error:",
        error
      );

    }

  }

  initAuthCallback();

})();
