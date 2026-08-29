(function(){

  "use strict";


  /* ============================================================
     GLOBAL BOTTOM NAVIGATION
  ============================================================ */

  const nav = document.createElement("nav");

  nav.className = "mobile-nav";


  nav.innerHTML = `

    <a href="index.html" data-page="index.html">

      <span>⌂</span>

      হোম

    </a>


    <a href="favorites.html" data-page="favorites.html">

      <span>♡</span>

      সেভ করা

    </a>


    <a href="post-ad.html" data-page="post-ad.html">

      <span>＋</span>

      বিজ্ঞাপন দিন

    </a>


    <a href="messages.html" data-page="messages.html">

      <span>▤</span>

      মেসেজ

    </a>


    <a href="profile.html" data-page="profile.html">

      <span>♙</span>

      প্রোফাইল

    </a>

  `;


  /* ============================================================
     AUTO ACTIVE PAGE
  ============================================================ */

  let currentPage =
    window.location.pathname
      .split("/")
      .pop();


  if(
    !currentPage ||
    currentPage === "/"
  ){

    currentPage = "index.html";

  }


  const links =
    nav.querySelectorAll("a");


  links.forEach(function(link){

    if(
      link.dataset.page ===
      currentPage
    ){

      link.classList.add("active");

    }

  });


  /* ============================================================
     INSERT NAVIGATION
  ============================================================ */

  document.body.appendChild(nav);


})();
