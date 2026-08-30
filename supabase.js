// ============================================================
// শাহমাহমুদপুর বাজার — Supabase Configuration
// Professional Auth + Auto Session Refresh
// ============================================================

"use strict";


// ============================================================
// CONFIG
// ============================================================

const SUPABASE_URL =
  "https://jeupbfoceqmnpwlklche.supabase.co";


const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldXBiZm9jZXFtbnB3bGtsY2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4Nzc4NjEsImV4cCI6MjEwMzQ1Mzg2MX0.-1NNm67t4HiB-I8fgTZcOwDHVrwmFtTH7T6DnkveXt4";


// ============================================================
// STORAGE KEYS
// ============================================================

const SMB_SESSION_KEY =
  "smb_supabase_session";


const SMB_USER_KEY =
  "smb_user_v1";


// ============================================================
// AUTH STATE
// ============================================================

let refreshPromise = null;

let sessionRefreshTimer = null;


// ============================================================
// BASIC SUPABASE FETCH
// ============================================================

async function sbFetch(path, options = {}) {

  const headers = {

    "apikey": SUPABASE_ANON_KEY,

    "Content-Type":
      "application/json",

    ...(options.headers || {})

  };


  const response = await fetch(

    SUPABASE_URL + path,

    {

      ...options,

      headers

    }

  );


  const text =
    await response.text();


  let data = null;


  try {

    data =
      text
        ? JSON.parse(text)
        : null;

  } catch (error) {

    data = text;

  }


  if (!response.ok) {

    const message =

      data?.message ||

      data?.msg ||

      data?.error_description ||

      data?.error ||

      data?.hint ||

      "Supabase request failed.";


    throw new Error(message);

  }


  return data;

}


// ============================================================
// GET SESSION FROM LOCAL STORAGE
// ============================================================

function getSbSession() {

  try {

    const raw =
      localStorage.getItem(
        SMB_SESSION_KEY
      );


    if (!raw) {

      return null;

    }


    const session =
      JSON.parse(raw);


    if (

      !session ||

      !session.access_token

    ) {

      return null;

    }


    return session;


  } catch (error) {

    console.error(
      "Session read error:",
      error
    );


    return null;

  }

}


// ============================================================
// SAVE SESSION
// ============================================================

function setSbSession(session) {

  if (

    !session ||

    !session.access_token

  ) {

    return;

  }


  try {

    // --------------------------------------------------------
    // expires_at না থাকলে তৈরি করা
    // --------------------------------------------------------

    if (

      !session.expires_at &&

      session.expires_in

    ) {

      session.expires_at =

        Math.floor(
          Date.now() / 1000
        )

        +

        Number(
          session.expires_in
        );

    }


    localStorage.setItem(

      SMB_SESSION_KEY,

      JSON.stringify(session)

    );


    // Auto refresh schedule

    scheduleSessionRefresh();


  } catch (error) {

    console.error(
      "Session save error:",
      error
    );

  }

}


// ============================================================
// CLEAR SESSION
// ============================================================

function clearSbSession() {

  try {

    localStorage.removeItem(
      SMB_SESSION_KEY
    );


    localStorage.removeItem(
      SMB_USER_KEY
    );


    if (
      sessionRefreshTimer
    ) {

      clearTimeout(
        sessionRefreshTimer
      );

      sessionRefreshTimer =
        null;

    }


  } catch (error) {

    console.error(
      "Session clear error:",
      error
    );

  }

}


// ============================================================
// CHECK SESSION EXPIRY
// ============================================================

function isSessionExpired(
  session,
  bufferSeconds = 60
) {

  if (!session) {

    return true;

  }


  if (!session.expires_at) {

    return false;

  }


  const now =

    Math.floor(
      Date.now() / 1000
    );


  return (

    now >=
    Number(session.expires_at)
    -
    bufferSeconds

  );

}


// ============================================================
// REFRESH ACCESS TOKEN
// ============================================================

async function refreshSbSession() {

  // একই সময়ে multiple refresh আটকানো

  if (refreshPromise) {

    return refreshPromise;

  }


  refreshPromise = (

    async function () {

      const session =
        getSbSession();


      if (

        !session ||

        !session.refresh_token

      ) {

        clearSbSession();

        return null;

      }


      try {

        const data =
          await sbFetch(

            "/auth/v1/token?grant_type=refresh_token",

            {

              method:"POST",

              body:
                JSON.stringify({

                  refresh_token:
                    session.refresh_token

                })

            }

          );


        if (

          !data ||

          !data.access_token

        ) {

          throw new Error(
            "Failed to refresh session."
          );

        }


        const newSession = {

          ...session,

          ...data

        };


        setSbSession(
          newSession
        );


        console.log(
          "Session refreshed successfully."
        );


        return newSession;


      } catch (error) {

        console.error(
          "Session refresh failed:",
          error
        );


        clearSbSession();


        return null;


      } finally {

        refreshPromise =
          null;

      }

    }

  )();


  return refreshPromise;

}


// ============================================================
// GET VALID SESSION
// Automatically refresh expired token
// ============================================================

async function getValidSbSession() {

  let session =
    getSbSession();


  if (!session) {

    return null;

  }


  if (

    isSessionExpired(
      session,
      60
    )

  ) {

    session =
      await refreshSbSession();

  }


  return session;

}


// ============================================================
// AUTO SESSION REFRESH TIMER
// ============================================================

function scheduleSessionRefresh() {

  if (
    sessionRefreshTimer
  ) {

    clearTimeout(
      sessionRefreshTimer
    );

    sessionRefreshTimer =
      null;

  }


  const session =
    getSbSession();


  if (

    !session ||

    !session.refresh_token

  ) {

    return;

  }


  if (
    !session.expires_at
  ) {

    return;

  }


  const now =

    Math.floor(
      Date.now() / 1000
    );


  const expiresAt =
    Number(
      session.expires_at
    );


  // Expiry-এর 2 মিনিট আগে refresh

  let delay =

    (
      expiresAt
      -
      now
      -
      120
    )
    *
    1000;


  // Minimum 10 seconds

  if (
    delay < 10000
  ) {

    delay = 10000;

  }


  sessionRefreshTimer =

    setTimeout(

      async function () {

        await refreshSbSession();

      },

      delay

    );

}


// ============================================================
// AUTHORIZED FETCH
// Automatically refreshes session
// ============================================================

async function sbAuthFetch(
  path,
  options = {}
) {

  const session =
    await getValidSbSession();


  const headers = {

    ...(options.headers || {})

  };


  if (

    session &&

    session.access_token

  ) {

    headers.Authorization =

      "Bearer " +
      session.access_token;

  }


  return sbFetch(

    path,

    {

      ...options,

      headers

    }

  );

}


// ============================================================
// SAVE USER
// ============================================================

function saveUser(user) {

  if (!user) {

    return;

  }


  try {

    const metadata =
      user.user_metadata || {};


    localStorage.setItem(

      SMB_USER_KEY,

      JSON.stringify({

        id:
          user.id || "",

        name:

          metadata.full_name ||

          metadata.name ||

          "",

        email:

          user.email || "",

        phone:

          metadata.phone ||

          user.phone ||

          "",

        avatar:

          metadata.avatar_url ||

          metadata.picture ||

          ""

      })

    );


  } catch (error) {

    console.error(
      "User save error:",
      error
    );

  }

}


// ============================================================
// GET SAVED USER
// ============================================================

function getSavedUser() {

  try {

    const raw =
      localStorage.getItem(
        SMB_USER_KEY
      );


    if (!raw) {

      return null;

    }


    return JSON.parse(raw);


  } catch (error) {

    return null;

  }

}


// ============================================================
// GET CURRENT SUPABASE USER
// ============================================================

async function getCurrentUser() {

  const session =
    await getValidSbSession();


  if (

    !session ||

    !session.access_token

  ) {

    return null;

  }


  try {

    const user =
      await sbFetch(

        "/auth/v1/user",

        {

          headers: {

            "Authorization":

              "Bearer " +

              session.access_token

          }

        }

      );


    if (user) {

      saveUser(user);

    }


    return user;


  } catch (error) {

    console.error(
      "Current user error:",
      error
    );


    // Unauthorized হলে একবার refresh try

    try {

      const newSession =
        await refreshSbSession();


      if (

        !newSession ||

        !newSession.access_token

      ) {

        return null;

      }


      const user =
        await sbFetch(

          "/auth/v1/user",

          {

            headers: {

              "Authorization":

                "Bearer " +

                newSession.access_token

            }

          }

        );


      if (user) {

        saveUser(user);

      }


      return user;


    } catch (retryError) {

      console.error(
        "Current user retry error:",
        retryError
      );


      return null;

    }

  }

}


// ============================================================
// GOOGLE LOGIN
// ============================================================

function googleLogin() {

  const redirectTo =

    window.location.origin +

    window.location.pathname;


  const url =

    SUPABASE_URL +

    "/auth/v1/authorize" +

    "?provider=google" +

    "&redirect_to=" +

    encodeURIComponent(
      redirectTo
    );


  window.location.href =
    url;

}


// ============================================================
// HANDLE GOOGLE OAUTH CALLBACK
// ============================================================

async function handleAuthCallback() {

  const hash =
    window.location.hash || "";


  if (

    !hash.includes(
      "access_token="
    )

  ) {

    return null;

  }


  try {

    const params =

      new URLSearchParams(

        hash.replace(
          /^#/,
          ""
        )

      );


    const accessToken =

      params.get(
        "access_token"
      );


    const refreshToken =

      params.get(
        "refresh_token"
      );


    const expiresIn =

      Number(

        params.get(
          "expires_in"
        )

        ||

        3600

      );


    const expiresAt =

      Math.floor(
        Date.now() / 1000
      )

      +

      expiresIn;


    if (!accessToken) {

      return null;

    }


    const session = {

      access_token:
        accessToken,

      refresh_token:
        refreshToken || "",

      expires_in:
        expiresIn,

      expires_at:
        expiresAt,

      token_type:

        params.get(
          "token_type"
        )

        ||

        "bearer"

    };


    setSbSession(
      session
    );


    // OAuth token URL থেকে remove

    history.replaceState(

      {},

      document.title,

      window.location.pathname +

      window.location.search

    );


    const user =
      await getCurrentUser();


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
// PASSWORD LOGIN
// ============================================================

async function login(payload) {

  const data =
    await sbFetch(

      "/auth/v1/token?grant_type=password",

      {

        method:"POST",

        body:
          JSON.stringify(
            payload
          )

      }

    );


  if (

    data &&

    data.access_token

  ) {

    setSbSession(
      data
    );


    // User data save

    try {

      const user =
        await getCurrentUser();

      if (user) {

        saveUser(user);

      }

    } catch (error) {

      console.warn(
        "User fetch after login failed:",
        error
      );

    }

  }


  return data;

}


// ============================================================
// SIGNUP
// ============================================================

async function signup(payload) {

  return await sbFetch(

    "/auth/v1/signup",

    {

      method:"POST",

      body:
        JSON.stringify(
          payload
        )

    }

  );

}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

  const session =
    getSbSession();


  try {

    if (

      session &&

      session.access_token

    ) {

      await fetch(

        SUPABASE_URL +

        "/auth/v1/logout",

        {

          method:"POST",

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
// AUTH SHORTCUT
// ============================================================

async function auth(
  action,
  payload = {}
) {

  if (
    action === "signup"
  ) {

    return await signup(
      payload
    );

  }


  if (
    action === "login"
  ) {

    return await login(
      payload
    );

  }


  if (
    action === "logout"
  ) {

    await logout();

    return {

      success:true

    };

  }


  throw new Error(

    "Unknown authentication action: " +

    action

  );

}


// ============================================================
// MULTI TAB SESSION SYNC
// ============================================================

window.addEventListener(

  "storage",

  function(event) {

    if (

      event.key ===
      SMB_SESSION_KEY

    ) {

      if (
        event.newValue
      ) {

        scheduleSessionRefresh();

      } else {

        if (
          sessionRefreshTimer
        ) {

          clearTimeout(
            sessionRefreshTimer
          );

          sessionRefreshTimer =
            null;

        }

      }

    }

  }

);


// ============================================================
// PAGE VISIBILITY CHECK
// Refresh token when returning to tab
// ============================================================

document.addEventListener(

  "visibilitychange",

  async function() {

    if (

      document.visibilityState ===
      "visible"

    ) {

      try {

        await getValidSbSession();

      } catch (error) {

        console.warn(
          "Session visibility refresh error:",
          error
        );

      }

    }

  }

);


// ============================================================
// ONLINE CHECK
// ============================================================

window.addEventListener(

  "online",

  async function() {

    try {

      await getValidSbSession();

    } catch (error) {

      console.warn(
        "Session online refresh error:",
        error
      );

    }

  }

);


// ============================================================
// INITIALIZE AUTH
// ============================================================

(async function initSupabaseAuth() {

  try {

    // Google callback থাকলে handle করবে

    await handleAuthCallback();


    // Existing session থাকলে validate করবে

    const session =
      await getValidSbSession();


    if (session) {

      scheduleSessionRefresh();

    }


  } catch (error) {

    console.error(
      "Auth initialization error:",
      error
    );

  }

})();


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.SUPABASE_URL =
  SUPABASE_URL;


window.SUPABASE_ANON_KEY =
  SUPABASE_ANON_KEY;


window.sbFetch =
  sbFetch;


window.sbAuthFetch =
  sbAuthFetch;


window.getSbSession =
  getSbSession;


window.getValidSbSession =
  getValidSbSession;


window.setSbSession =
  setSbSession;


window.clearSbSession =
  clearSbSession;


window.refreshSbSession =
  refreshSbSession;


window.getCurrentUser =
  getCurrentUser;


window.getSavedUser =
  getSavedUser;


window.saveUser =
  saveUser;


window.googleLogin =
  googleLogin;


window.handleAuthCallback =
  handleAuthCallback;


window.login =
  login;


window.signup =
  signup;


window.logout =
  logout;


window.auth =
  auth;
