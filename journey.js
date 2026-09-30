/* Scarecrow Selfie Journey — shared library.
   No dependencies, works fully offline. Photos are stored in IndexedDB on the
   visitor's own device; nothing is ever uploaded anywhere. */
(function (global) {
  "use strict";

  var TOP_TAG = "#KokomoScarecrows2026";

  /* Stop number, business name, and the sponsor hashtag baked into the bottom
     of that stop's journey photo. Edit tags here — snap.html and album.html
     both read from this table. */
  var STOPS = [
    { n: 1,  name: "Artworks Gallery",                    tag: "#ArtworksGallery" },
    { n: 2,  name: "Lucky Raven Tattoo Lounge",           tag: "#LuckyRaven" },
    { n: 3,  name: "Dechert Law Office",                  tag: "#DechertLaw" },
    { n: 4,  name: "The Hardie Group Real Estate Company", tag: "#HardieGroup" },
    { n: 5,  name: "Kokomo Area Lions",                   tag: "#KokomoLions" },
    { n: 6,  name: "UpCreations (Urban Outreach)",        tag: "#UpCreations" },
    { n: 7,  name: "Oscar's Pizza",                       tag: "#OscarsPizza" },
    { n: 8,  name: "SUTE",                                tag: "#SUTE" },
    { n: 9,  name: "Kokomo Tribune",                      tag: "#KokomoTribune" },
    { n: 10, name: "Community Foundation",                tag: "#CommunityFoundation" },
    { n: 11, name: "PF Hendricks LLC",                    tag: "#PFHendricks" },
    { n: 12, name: "Community First Bank of Indiana",     tag: "#CommunityFirstBank" },
    { n: 13, name: "Fired Arts Studio",                   tag: "#FiredArtsStudio" },
    { n: 14, name: "The Coterie",                         tag: "#TheCoterie" },
    { n: 15, name: "First Farmers Bank & Trust",          tag: "#FirstFarmersBank" },
    { n: 16, name: "Pix Pots Pottery",                    tag: "#PixPotsPottery" },
    { n: 17, name: "IUK SNAHP (Nursing & Allied Health)", tag: "#IUKSNAHP" },
    { n: 18, name: "YMCA of Kokomo",                      tag: "#YMCAKokomo" },
    { n: 19, name: "Indiana Underdog Martial Arts",       tag: "#IndianaUnderdog" },
    { n: 20, name: "Tip Top Car Washes",                  tag: "#TipTopCarWash" },
    { n: 21, name: "Crossroads Community Church",         tag: "#CrossroadsChurch" }
  ];

  function stopByNumber(n) {
    for (var i = 0; i < STOPS.length; i++) {
      if (STOPS[i].n === n) return STOPS[i];
    }
    return null;
  }

  function slug(name) {
    return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function zipName(stop) {
    var nn = stop.n < 10 ? "0" + stop.n : "" + stop.n;
    return "scarecrow-" + nn + "-" + slug(stop.name) + ".png";
  }

  /* ---------------- IndexedDB: the on-device photo album ---------------- */
  var DB_NAME = "scarecrowJourney";
  var STORE = "photos";

  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!("indexedDB" in global)) { reject(new Error("no-indexeddb")); return; }
      var req = global.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        req.result.createObjectStore(STORE, { keyPath: "stop" });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error("db-open-failed")); };
    });
  }

  function withStore(mode, fn) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction(STORE, mode);
        var st = t.objectStore(STORE);
        var out;
        try { out = fn(st); } catch (e) { reject(e); return; }
        t.oncomplete = function () { resolve(out && out.result !== undefined ? out.result : out); db.close(); };
        t.onerror = function () { reject(t.error || new Error("db-tx-failed")); db.close(); };
      });
    });
  }

  var db = {
    save: function (stopN, blob) {
      return withStore("readwrite", function (st) {
        return st.put({ stop: stopN, blob: blob, ts: Date.now() });
      });
    },
    get: function (stopN) {
      return withStore("readonly", function (st) { return st.get(stopN); });
    },
    all: function () {
      return withStore("readonly", function (st) { return st.getAll(); }).then(function (rows) {
        rows.sort(function (a, b) { return a.stop - b.stop; });
        return rows;
      });
    },
    count: function () {
      return withStore("readonly", function (st) { return st.count(); }).then(function (r) { return r; });
    }
  };

  /* ---------------- Journey frame renderer ----------------
     1080x1350 (4:5) canvas. Photo cover-crops the middle band;
     flat high-contrast ribbons carry the tags for easy reading. */
  function drawJourneyFrame(canvas, img, sponsorTag) {
    var W = 1080, H = 1350, RIB = 120;
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#173f6b";
    ctx.fillRect(0, 0, W, H);
    var pw = img.naturalWidth || img.width;
    var ph = img.naturalHeight || img.height;
    if (pw > 0 && ph > 0) {
      var bandH = H - RIB * 2;
      var scale = Math.max(W / pw, bandH / ph);
      var dw = pw * scale, dh = ph * scale;
      ctx.drawImage(img, (W - dw) / 2, RIB + (bandH - dh) / 2, dw, dh);
    }
    ctx.fillStyle = "#f7f1e3";
    ctx.fillRect(0, 0, W, RIB);
    ctx.fillStyle = "#173f6b";
    ctx.fillRect(0, H - RIB, W, RIB);
    ctx.fillStyle = "#e8a33d";
    ctx.fillRect(0, RIB - 6, W, 6);
    ctx.fillRect(0, H - RIB, W, 6);
    label(ctx, W, TOP_TAG, RIB / 2, "#173f6b");
    label(ctx, W, sponsorTag, H - RIB / 2, "#f7f1e3");
  }

  function label(ctx, W, text, y, color) {
    var size = 58;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (;;) {
      ctx.font = "800 " + size + "px -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
      if (ctx.measureText(text).width <= W - 80 || size <= 22) break;
      size -= 4;
    }
    ctx.fillStyle = color;
    ctx.fillText(text, W / 2, y);
  }

  /* ---------------- CRC32 + minimal stored ZIP writer ---------------- */
  var crcTable = (function () {
    var t = new Array(256), c, k, n;
    for (n = 0; n < 256; n++) {
      c = n;
      for (k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var crc = 0xffffffff, i;
    for (i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function pushU16(a, v) { a.push(v & 255, (v >>> 8) & 255); }
  function pushU32(a, v) { a.push(v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255); }

  /* entries: [{name, data: Uint8Array}] -> Blob (application/zip) */
  function makeZip(entries) {
    var enc = new TextEncoder();
    var d = new Date();
    var dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    var out = [];
    var central = [];
    var offset = 0, i, e, nameB, lh, ch, crc, size;
    for (i = 0; i < entries.length; i++) {
      e = entries[i];
      nameB = enc.encode(e.name);
      crc = crc32(e.data);
      size = e.data.length;
      lh = [];
      pushU32(lh, 0x04034b50);
      pushU16(lh, 20);
      pushU16(lh, 0x0800);
      pushU16(lh, 0);
      pushU16(lh, dosTime); pushU16(lh, dosDate);
      pushU32(lh, crc);
      pushU32(lh, size); pushU32(lh, size);
      pushU16(lh, nameB.length); pushU16(lh, 0);
      for (var b = 0; b < nameB.length; b++) lh.push(nameB[b]);
      for (b = 0; b < e.data.length; b++) lh.push(e.data[b]);
      for (b = 0; b < lh.length; b++) out.push(lh[b]);

      ch = [];
      pushU32(ch, 0x02014b50);
      pushU16(ch, 20); pushU16(ch, 20);
      pushU16(ch, 0x0800);
      pushU16(ch, 0);
      pushU16(ch, dosTime); pushU16(ch, dosDate);
      pushU32(ch, crc);
      pushU32(ch, size); pushU32(ch, size);
      pushU16(ch, nameB.length); pushU16(ch, 0); pushU16(ch, 0);
      pushU16(ch, 0); pushU16(ch, 0);
      pushU32(ch, 0);
      pushU32(ch, offset);
      for (b = 0; b < nameB.length; b++) ch.push(nameB[b]);
      for (b = 0; b < ch.length; b++) central.push(ch[b]);
      offset += lh.length;
    }
    var cdStart = out.length;
    for (i = 0; i < central.length; i++) out.push(central[i]);
    var cdSize = out.length - cdStart;
    var end = [];
    pushU32(end, 0x06054b50);
    pushU16(end, 0); pushU16(end, 0);
    pushU16(end, entries.length); pushU16(end, entries.length);
    pushU32(end, cdSize);
    pushU32(end, cdStart);
    pushU16(end, 0);
    for (i = 0; i < end.length; i++) out.push(end[i]);
    return new Blob([new Uint8Array(out)], { type: "application/zip" });
  }

  /* ---------------- Native share sheet ---------------- */
  function canShareFiles(files) {
    return !!(global.navigator && global.navigator.canShare && global.navigator.canShare({ files: files }));
  }

  function shareFiles(files, title, text) {
    if (canShareFiles(files)) {
      return global.navigator.share({ files: files, title: title, text: text }).then(
        function () { return true; },
        function () { return false; }
      );
    }
    return Promise.resolve(false);
  }

  function downloadBlob(blob, filename) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }

  global.Journey = {
    TOP_TAG: TOP_TAG,
    STOPS: STOPS,
    stopByNumber: stopByNumber,
    slug: slug,
    zipName: zipName,
    db: db,
    drawJourneyFrame: drawJourneyFrame,
    makeZip: makeZip,
    canShareFiles: canShareFiles,
    shareFiles: shareFiles,
    downloadBlob: downloadBlob
  };
})(window);
