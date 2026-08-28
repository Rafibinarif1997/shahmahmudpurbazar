// ============================================================
// শাহমাহমুদপুর বাজার — APP.JS
// SUPABASE MARKETPLACE VERSION
// ============================================================

(function () {

  "use strict";


  // ----------------------------------------------------------
  // Supabase configuration
  // ----------------------------------------------------------

  const SUPA_URL =
    window.SUPABASE_URL ||
    "https://jeupbfoceqmnpwlklche.supabase.co";

  const SUPA_KEY =
    window.SUPABASE_ANON_KEY ||
    window.supabaseAnonKey ||
    "";


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
  // Money
  // ----------------------------------------------------------

  window.money = function (value) {

    const number =
      Number(value || 0);

    return "৳ " +
      number.toLocaleString("bn-BD");

  };


  // ----------------------------------------------------------
  // Local cache
  // ----------------------------------------------------------

  window.ads = function () {

    try {

      const raw =
        localStorage.getItem(
          "smb_ads_v1"
        );

      if (!raw) return [];

      const data =
        JSON.parse(raw);

      return Array.isArray(data)
        ? data
        : [];

    } catch (error) {

      console.error(
        "Ads cache error:",
        error
      );

      return [];

    }

  };


  // ----------------------------------------------------------
  // Save local cache
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
        "Ads cache save error:",
        error
      );

      return false;

    }

  };


  // ----------------------------------------------------------
  // LOAD PUBLISHED ADS FROM SUPABASE
  // ----------------------------------------------------------

  window.syncPublishedAds =
    async function () {

      if (!SUPA_KEY) {

        console.error(
          "SUPABASE_ANON_KEY পাওয়া যায়নি।"
        );

        return window.ads();

      }


      try {

        const response =
          await fetch(

            SUPA_URL +
            "/rest/v1/ads" +
            "?status=eq.approved" +
            "&select=*" +
            "&order=created_at.desc",

            {

              method: "GET",

              headers: {

                "apikey":
                  SUPA_KEY,

                "Authorization":
                  "Bearer " +
                  SUPA_KEY,

                "Content-Type":
                  "application/json"

              }

            }

          );


        if (!response.ok) {

          const text =
            await response.text();

          console.error(
            "Published ads fetch error:",
            text
          );

          return window.ads();

        }


        const data =
          await response.json();


        if (
          Array.isArray(data)
        ) {

          window.saveAds(data);

          return data;

        }


        return [];

      } catch (error) {

        console.error(
          "Published ads sync error:",
          error
        );

        return window.ads();

      }

    };


  // ----------------------------------------------------------
  // GET SINGLE AD FROM SUPABASE
  // ----------------------------------------------------------

  window.getAdById =
    async function (adId) {

      if (!adId) return null;


      /*
       * প্রথমে local cache
       */

      try {

        const cached =
          window.ads();


        const localAd =
          cached.find(
            function (item) {

              return String(
                item.id
              ) === String(
                adId
              );

            }
          );


        if (
          localAd &&
          (
            localAd.status === "approved" ||
            localAd.status === "published"
          )
        ) {

          return localAd;

        }

      } catch (error) {

        console.error(
          "Local ad lookup error:",
          error
        );

      }


      /*
       * Local cache-এ না থাকলে
       * সরাসরি Supabase
       */

      if (!SUPA_KEY) {

        return null;

      }


      try {

        const response =
          await fetch(

            SUPA_URL +
            "/rest/v1/ads" +
            "?id=eq." +
            encodeURIComponent(adId) +
            "&status=eq.approved" +
            "&select=*",

            {

              method: "GET",

              headers: {

                "apikey":
                  SUPA_KEY,

                "Authorization":
                  "Bearer " +
                  SUPA_KEY,

                "Content-Type":
                  "application/json"

              }

            }

          );


        if (!response.ok) {

          console.error(
            "Single ad fetch error:",
            await response.text()
          );

          return null;

        }


        const data =
          await response.json();


        if (
          Array.isArray(data) &&
          data.length > 0
        ) {

          return data[0];

        }


        /*
         * যদি status approved না হয়ে
         * published থাকে
         */

        const response2 =
          await fetch(

            SUPA_URL +
            "/rest/v1/ads" +
            "?id=eq." +
            encodeURIComponent(adId) +
            "&status=eq.published" +
            "&select=*",

            {

              headers: {

                "apikey":
                  SUPA_KEY,

                "Authorization":
                  "Bearer " +
                  SUPA_KEY

              }

            }

          );


        if (response2.ok) {

          const data2 =
            await response2.json();


          if (
            Array.isArray(data2) &&
            data2.length > 0
          ) {

            return data2[0];

          }

        }

      } catch (error) {

        console.error(
          "Get ad by ID error:",
          error
        );

      }


      return null;

    };


  // ----------------------------------------------------------
  // Current Google user
  // ----------------------------------------------------------

  window.getSmbUser =
    async function () {

      try {

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


        const raw =
          localStorage.getItem(
            "smb_user_v1"
          );


        if (!raw) return null;


        const user =
          JSON.parse(raw);


        return user &&
          user.email
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
  // Header authentication
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

            ?

            `

              <img
                class="profile-avatar"
                src="${window.escapeHtml(avatar)}"
                alt="Profile"
                referrerpolicy="no-referrer">

            `

            :

            `

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


    if (
      document.getElementById(
        "authArea"
      )
    ) {

      await window.renderSmbAuth(
        "authArea"
      );

    }

  }


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
