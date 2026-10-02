/* stop-ux.js — shared stop-page helpers (include after journey.js + tutorial.js):
   1) First-time coach marks: glowing ring + arrow walking the visitor
      through letter -> selfie on their first stop page.
   2) Selfie-prompt overlay: if this stop has no selfie yet, a friendly modal
      prompts the visitor to pose WITH the scarecrow, with a button that
      opens the camera directly. */
(function () {
  "use strict";

  function stopNumber() {
    var a = document.querySelector('.journey-btn[href*="snap.html?stop="]');
    if (a) {
      var m = /stop=(\d+)/.exec(a.getAttribute("href") || "");
      if (m) return parseInt(m[1], 10);
    }
    var num = document.querySelector(".num");
    if (num) {
      var m2 = /#(\d+)/.exec(num.textContent || "");
      if (m2) return parseInt(m2[1], 10);
    }
    return null;
  }

  var css = ".sp-dim{position:fixed;inset:0;background:rgba(9,20,32,.72);z-index:13000;display:flex;align-items:center;justify-content:center;padding:24px;}" +
    ".sp-dim[hidden]{display:none;}" +
    ".sp-card{background:linear-gradient(165deg,#fffef9,#fdf3e0);border:3px solid #e8722a;border-radius:22px;" +
    "max-width:400px;width:100%;padding:30px 26px;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,.5);" +
    "animation:spPop .45s cubic-bezier(.2,1.3,.4,1);}" +
    "@keyframes spPop{from{transform:scale(.7);opacity:0;}to{transform:scale(1);opacity:1;}}" +
    ".sp-emoji{font-size:52px;margin-bottom:10px;}" +
    ".sp-title{font-size:23px;font-weight:800;color:#173f6b;margin-bottom:10px;}" +
    ".sp-text{font-size:16px;line-height:1.6;color:#5c5040;margin-bottom:20px;}" +
    ".sp-btn{display:block;width:100%;background:#d9481c;color:#fff;font-weight:800;font-size:18px;border:none;" +
    "border-radius:999px;padding:15px;cursor:pointer;text-decoration:none;box-shadow:0 0 20px rgba(217,72,28,.4);margin-bottom:12px;}" +
    ".sp-later{background:none;border:none;color:#8a7a63;font-size:15px;cursor:pointer;text-decoration:underline;}";
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  function selfiePrompt(N) {
    var dim = document.createElement("div");
    dim.className = "sp-dim";
    dim.setAttribute("hidden", "");
    dim.innerHTML =
      '<div class="sp-card" role="dialog" aria-modal="true" aria-label="Take your selfie">' +
      '<div class="sp-emoji">\uD83D\uDCF8</div>' +
      '<div class="sp-title">Don\u2019t forget your selfie!</div>' +
      '<p class="sp-text">Pose <strong>with</strong> the scarecrow &mdash; smile, be silly, get the whole scene. ' +
      'Your <strong>Scarecrow Selfie Storybook</strong> needs one photo at every stop.</p>' +
      '<a class="sp-btn" href="snap.html?stop=' + N + '&camera=1">Take your selfie</a>' +
      '<button type="button" class="sp-later">I\u2019ll do it later</button>' +
      "</div>";
    document.body.appendChild(dim);
    dim.querySelector(".sp-later").addEventListener("click", function () {
      dim.setAttribute("hidden", "");
    });
    dim.addEventListener("click", function (e) {
      if (e.target === dim) dim.setAttribute("hidden", "");
    });
    return dim;
  }

  function maybeSelfiePrompt(N) {
    if (!window.Journey || !Journey.db) return;
    Journey.db.get(N).then(function (rec) {
      if (rec && rec.blob) return; // already have the selfie
      setTimeout(function () {
        var dim = selfiePrompt(N);
        dim.removeAttribute("hidden");
      }, 2500);
    }).catch(function () {});
  }

  function init() {
    var N = stopNumber();
    if (!N || !window.CoachMarks) { if (N) maybeSelfiePrompt(N); return; }
    window.CoachMarks.run("stop", [
      { sel: ".letter", title: "Your letter is banked!",
        text: "This stop\u2019s letter is saved automatically \u2014 just write it in the matching blank on your hunt card." },
      { sel: ".journey-cta", title: "Now strike a pose!",
        text: "Take a selfie WITH the scarecrow at every stop. All 21 photos become your Scarecrow Selfie Storybook." }
    ], function () {
      maybeSelfiePrompt(N);
    });
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(init, 400);
  } else {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 400); });
  }
})();
