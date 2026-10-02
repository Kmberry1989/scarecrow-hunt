/* tutorial.js — first-time coach marks: a glowing ring + bouncing arrow +
   tooltip card walking the visitor through what to do next.
   Usage: CoachMarks.run("key", [{sel, title, text}, ...], doneFn) */
(function () {
  "use strict";

  var tourEls = null, tourState = null;

  function seen(key) {
    try { return localStorage.getItem("tut_" + key) === "1"; } catch (e) { return false; }
  }
  function markSeen(key) {
    try { localStorage.setItem("tut_" + key, "1"); } catch (e) {}
  }
  function endTour() {
    if (tourEls) {
      for (var i = 0; i < tourEls.length; i++) {
        if (tourEls[i] && tourEls[i].parentNode) tourEls[i].parentNode.removeChild(tourEls[i]);
      }
      tourEls = null;
    }
    tourState = null;
    window.removeEventListener("scroll", reposition, true);
    window.removeEventListener("resize", reposition);
  }
  function reposition() {
    if (tourState) positionStep(tourState);
  }
  function positionStep(st) {
    var step = st.steps[st.i];
    var target = document.querySelector(step.sel);
    if (!target) { nextStep(st); return; }
    try { target.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {}
    setTimeout(function () {
      if (!tourState) return;
      var r = target.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) { nextStep(st); return; }
      var pad = 10;
      st.ring.style.left = (r.left - pad) + "px";
      st.ring.style.top = (r.top - pad) + "px";
      st.ring.style.width = (r.width + pad * 2) + "px";
      st.ring.style.height = (r.height + pad * 2) + "px";
      st.tipTitle.textContent = step.title;
      st.tipText.textContent = step.text;
      st.nextBtn.textContent = st.i === st.steps.length - 1 ? "Got it!" : "Next \u203a";
      st.tip.style.visibility = "hidden";
      var above = r.top > window.innerHeight * 0.42;
      var tipW = 304, tipH = st.tip.offsetHeight || 170;
      var tipTop = above ? Math.max(12, r.top - pad - tipH - 46) : r.bottom + pad + 46;
      if (!above && tipTop + tipH > window.innerHeight - 12) {
        tipTop = Math.max(12, window.innerHeight - tipH - 12);
      }
      st.tip.style.top = tipTop + "px";
      st.tip.style.left = Math.max(12, Math.min(Math.max(12, window.innerWidth - tipW - 12), (r.left + r.width / 2) - tipW / 2)) + "px";
      st.tip.style.visibility = "visible";
      if (above) {
        st.arrow.textContent = "\u2b07";
        st.arrow.style.top = Math.max(8, r.top - pad - 42) + "px";
      } else {
        st.arrow.textContent = "\u2b06";
        st.arrow.style.top = (r.bottom + pad + 4) + "px";
      }
      st.arrow.style.left = (r.left + r.width / 2 - 18) + "px";
    }, 450);
  }
  function nextStep(st) {
    st.i++;
    if (st.i >= st.steps.length) {
      var done = st.done;
      endTour();
      markSeen(st.key);
      if (done) done();
      return;
    }
    positionStep(st);
  }
  function run(key, steps, done) {
    if (seen(key) || !steps || !steps.length) { if (done) done(); return; }
    var dim = document.createElement("div"); dim.className = "tut-dim";
    var ring = document.createElement("div"); ring.className = "tut-ring";
    var arrow = document.createElement("div"); arrow.className = "tut-arrow";
    var tip = document.createElement("div"); tip.className = "tut-tip";
    var tipTitle = document.createElement("div"); tipTitle.className = "tut-tip-title";
    var tipText = document.createElement("div"); tipText.className = "tut-tip-text";
    var row = document.createElement("div"); row.className = "tut-row";
    var skipBtn = document.createElement("button");
    skipBtn.type = "button"; skipBtn.className = "tut-skip"; skipBtn.textContent = "Skip tour";
    var nextBtn = document.createElement("button");
    nextBtn.type = "button"; nextBtn.className = "tut-next"; nextBtn.textContent = "Next \u203a";
    row.appendChild(skipBtn); row.appendChild(nextBtn);
    tip.appendChild(tipTitle); tip.appendChild(tipText); tip.appendChild(row);
    document.body.appendChild(dim);
    document.body.appendChild(ring);
    document.body.appendChild(arrow);
    document.body.appendChild(tip);
    tourEls = [dim, ring, arrow, tip];
    var st = { key: key, steps: steps, i: 0, ring: ring, tip: tip, arrow: arrow,
               tipTitle: tipTitle, tipText: tipText, nextBtn: nextBtn, done: done };
    tourState = st;
    nextBtn.addEventListener("click", function () { nextStep(st); });
    skipBtn.addEventListener("click", function () {
      var d = st.done;
      endTour(); markSeen(key);
      if (d) d();
    });
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    positionStep(st);
  }

  var css = ".tut-dim{position:fixed;inset:0;background:rgba(9,20,32,.62);z-index:12000;}" +
    ".tut-ring{position:fixed;z-index:12001;border:3px solid #e8a33d;border-radius:14px;pointer-events:none;" +
    "box-shadow:0 0 0 4px rgba(232,163,61,.35),0 0 34px 8px rgba(232,163,61,.55);animation:tutPulse 1.3s ease-in-out infinite;}" +
    "@keyframes tutPulse{0%,100%{box-shadow:0 0 0 4px rgba(232,163,61,.35),0 0 34px 8px rgba(232,163,61,.55);}50%{box-shadow:0 0 0 7px rgba(232,163,61,.5),0 0 52px 16px rgba(232,163,61,.7);}}" +
    ".tut-arrow{position:fixed;z-index:12002;font-size:34px;color:#e8a33d;text-shadow:0 2px 8px rgba(0,0,0,.6);" +
    "animation:tutBounce .8s ease-in-out infinite;pointer-events:none;width:36px;text-align:center;}" +
    "@keyframes tutBounce{0%,100%{transform:translateY(0);}50%{transform:translateY(9px);}}" +
    ".tut-tip{position:fixed;z-index:12003;width:304px;max-width:calc(100vw - 24px);background:#fffdf6;color:#4c4132;" +
    "border:2px solid #e8a33d;border-radius:16px;padding:16px 18px;text-align:left;box-shadow:0 14px 40px rgba(0,0,0,.4);}" +
    ".tut-tip-title{font-weight:800;font-size:17px;color:#173f6b;margin-bottom:6px;}" +
    ".tut-tip-text{font-size:15px;line-height:1.55;color:#5c5040;}" +
    ".tut-row{display:flex;justify-content:space-between;align-items:center;margin-top:14px;}" +
    ".tut-next{background:#d9481c;color:#fff;font-weight:800;font-size:16px;border:none;border-radius:999px;padding:10px 26px;cursor:pointer;}" +
    ".tut-skip{background:none;border:none;color:#8a7a63;font-size:14px;cursor:pointer;text-decoration:underline;}";
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  window.CoachMarks = { run: run, seen: seen };
})();
