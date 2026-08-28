// ============================================================
// শাহমাহমুদপুর বাজার — APP.JS
// ============================================================

(function () {

  // ----------------------------------------------------------
  // HTML escape
  // ----------------------------------------------------------

  window.escapeHtml = function (value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  };


  // ----------------------------------------------------------
  // Money formatter
  // ----------------------------------------------------------

  window.money = function (value) {

    const number =
      Number(value || 0);

    return "৳ " +
      number.toLocaleString("bn-BD");

  };


  // ----------------------------------------------------------
  // Local ads storage
  // ----------------------------------------------------------

  window.ads = function () {

    try {

      const raw =
        localStorage.getItem("smb_ads_v1");

      if (!raw) return [];

      const data =
        JSON.parse(raw);

      return Array.isArray(data)
        ? data
        : [];

    } catch (error) {

      console.error(
        "Ads load error:",
        error
      );

      return [];

    }

  };


  // ----------------------------------------------------------
  // Save ads
  // ----------------------------------------------------------

  window.saveAds = function (data) {

    try {

      localStorage.setItem(
        "smb_ads_v1",
        JSON.stringify(
          Array.isArray(data)
            ? data
            : []
        )
      );

      return true;

    } catch (error) {

      console.error(
        "Ads save error:",
        error
      );

      return false;

    }

  };


  // ----------------------------------------------------------
  // Current Google user
  // ----------------------------------------------------------

  window.getSmbUser =
    async function () {

      try {

        // প্রথমে Supabase session
        if (
          typeof window.getCurrentUser ===
          "function"
        ) {

          const user =
            await window.getCurrentUser();

          if (user) {

            const metadata =
              user.user_metadata || {};

            const profile = {

              id:
                user.id || "",

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

            };

            localStorage.setItem(
              "smb_user_v1",
              JSON.stringify(profile)
            );

            return profile;

          }

        }


        // Backup local profile
        const raw =
          localStorage.getItem(
            "smb_user_v1"
          );

        if (!raw) return null;

        const user =
          JSON.parse(raw);

        return user && user.email
          ? user
          : null;

      } catch (error) {

        console.error(
          "User load error:",
          error
        );

        return null;

      }

    };


  // ----------------------------------------------------------
  // Require Login
  // ----------------------------------------------------------

  window.requireSmbUser =
    async function () {

      const user =
        await window.getSmbUser();

      if (!user) {

        window.location.href =
          "login.html";

        return null;

      }

      return user;

    };


  // ----------------------------------------------------------
  // Render header authentication
  // ----------------------------------------------------------

  window.renderSmbAuth =
    async function (
      elementId = "authArea"
    ) {

      const area =
        document.getElementById(
          elementId
        );

      if (!area) return;

      const user =
        await window.getSmbUser();


      if (!user) {

        area.innerHTML = `
          <a
            class="login-link"
            href="login.html">
            লগইন
          </a>
        `;

        return;

      }


      const name =
        user.name ||
        user.email ||
        "Profile";


      const avatar =
        user.avatar || "";


      area.innerHTML = `

        <a
          href="profile.html"
          class="profile-link">

          ${
            avatar

            ? `

              <img
                class="profile-avatar"
                src="${window.escapeHtml(avatar)}"
                alt="Profile"
                referrerpolicy="no-referrer"
              >

            `

            : `

              <div
                class="profile-avatar"
                style="
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  color:#69f5a5;
                ">
                ♙
              </div>

            `
          }

          <span class="profile-name">
            ${window.escapeHtml(name)}
          </span>

        </a>

      `;

    };


  // ----------------------------------------------------------
  // Logout
  // ----------------------------------------------------------

  window.smbLogout =
    async function () {

      try {

        if (
          typeof window.logout ===
          "function"
        ) {

          await window.logout();

          return;

        }

      } catch (error) {

        console.error(
          "Supabase logout error:",
          error
        );

      }


      localStorage.removeItem(
        "smb_user_v1"
      );

      localStorage.removeItem(
        "smb_supabase_session"
      );

      window.location.href =
        "index.html";

    };


  // ----------------------------------------------------------
  // Page initialization
  // ----------------------------------------------------------

  async function init() {

    /*
     * Google OAuth callback handle
     *
     * supabase.js যদি callback handle করার
     * function দেয়, সেটি চালানো হবে।
     */

    try {

      if (
        typeof window.handleAuthCallback ===
        "function"
      ) {

        await window.handleAuthCallback();

      }

    } catch (error) {

      console.error(
        "Auth callback error:",
        error
      );

    }


    /*
     * Header থাকলে authentication render
     */

    if (
      document.getElementById("authArea")
    ) {

      await window.renderSmbAuth(
        "authArea"
      );

    }

  }


  // DOM ready
  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();

  }

})();
