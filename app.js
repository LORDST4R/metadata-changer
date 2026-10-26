/**
 * Stardom — Uniquify Media
 * Client-side only. Photos + Videos. Media Library with day filters.
 */

const STORAGE_KEY = "stardom_library_v1";

let currentMode = "inject"; // inject | pure
let typeFilter = "all";     // all | photo | video
let queue = [];             // current session items waiting to uniquify
let library = loadLibrary();

// -------------------- Persistence --------------------
function loadLibrary() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLibrary() {
  // Store only lightweight meta + object URLs are session-only
  // We keep processed blobs as dataURLs for small items, or just metadata
  // For practicality we store metadata + a thumbnail dataURL
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library.slice(0, 80))); // cap
  } catch (e) {
    console.warn("Library storage full, trimming", e);
    library = library.slice(0, 40);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  }
}

// -------------------- Views --------------------
function switchView(view) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

  document.getElementById(`view-${view}`).classList.add("active");
  document.querySelector(`.nav-item[data-view="${view}"]`).classList.add("active");

  if (view === "library") renderLibrary();
}

// -------------------- Mode --------------------
function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll(".mode-card").forEach(c => {
    c.classList.toggle("active", c.dataset.mode === mode);
  });
}

// -------------------- Filters --------------------
function setTypeFilter(type) {
  typeFilter = type;
  document.querySelectorAll(".filter-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.type === type);
  });
  applyFilters();
}

function applyFilters() {
  renderLibrary();
}

function getDayRange(value) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (value === "all") return null;
  if (value === "today") return startOfToday;
  if (value === "yesterday") return startOfToday - 86400000;
  if (value === "7") return startOfToday - 7 * 86400000;
  if (value === "30") return startOfToday - 30 * 86400000;
  return null;
}

// -------------------- Upload / Queue --------------------
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");

dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  addToQueue(e.dataTransfer.files);
});
fileInput.addEventListener("change", e => {
  addToQueue(e.target.files);
  fileInput.value = "";
});

function isVideo(file) {
  return file.type.startsWith("video/") || /\.(mp4|mov|webm|m4v)$/i.test(file.name);
}

function isPhoto(file) {
  return file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(file.name);
}

function addToQueue(fileList) {
  const incoming = Array.from(fileList).filter(f => isPhoto(f) || isVideo(f));
  if (!incoming.length) {
    showStatus("No supported photos or videos found", "info");
    return;
  }

  incoming.forEach(file => {
    const id = crypto.randomUUID();
    const url = URL.createObjectURL(file);
    queue.push({
      id,
      file,
      url,
      type: isVideo(file) ? "video" : "photo",
      name: file.name,
      addedAt: Date.now()
    });
  });

  renderQueue();
  document.getElementById("queueSection").classList.remove("hidden");
  showStatus(`${incoming.length} item(s) added to queue`, "success");
}

function clearQueue() {
  queue.forEach(item => URL.revokeObjectURL(item.url));
  queue = [];
  renderQueue();
  document.getElementById("queueSection").classList.add("hidden");
}

function renderQueue() {
  const grid = document.getElementById("queueGrid");
  const count = document.getElementById("queueCount");
  count.textContent = queue.length;

  grid.innerHTML = queue.map(item => `
    <div class="media-card">
      <div class="media-thumb">
        ${item.type === "video"
          ? `<video src="${item.url}" muted></video>`
          : `<img src="${item.url}" alt="" loading="lazy" />`}
        <span class="media-badge ${item.type === "video" ? "badge-video" : "badge-photo"}">
          ${item.type}
        </span>
      </div>
      <div class="media-body">
        <div class="media-name" title="${item.name}">${item.name}</div>
        <div class="media-actions">
          <button class="btn btn-primary" onclick="uniquifyOne('${item.id}')">Uniquify</button>
          <button class="btn btn-ghost" onclick="removeFromQueue('${item.id}')">✕</button>
        </div>
      </div>
    </div>
  `).join("");
}

function removeFromQueue(id) {
  const idx = queue.findIndex(i => i.id === id);
  if (idx === -1) return;
  URL.revokeObjectURL(queue[idx].url);
  queue.splice(idx, 1);
  renderQueue();
  if (!queue.length) document.getElementById("queueSection").classList.add("hidden");
}

// -------------------- Core Uniquify (Photos) --------------------
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomString(len = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function generateUniqueExif(width, height) {
  const cameras = [
    ["Apple", "iPhone 15 Pro Max"],
    ["Apple", "iPhone 14 Pro"],
    ["Canon", "Canon EOS R5"],
    ["Sony", "Sony ILCE-7M4"],
    ["Nikon", "NIKON Z 8"],
    ["Samsung", "SM-S928B"],
    ["Google", "Pixel 8 Pro"],
    ["Fujifilm", "X-T5"]
  ];
  const software = [
    "Adobe Photoshop 25.0",
    "Adobe Lightroom Classic 13.2",
    "Apple Photos 10.0",
    "Google Photos",
    "Capture One 16"
  ];

  const [make, model] = randomChoice(cameras);
  const soft = randomChoice(software);
  const past = new Date(Date.now() - Math.random() * 700 * 86400000);
  const pad = n => String(n).padStart(2, "0");
  const dt = `${past.getFullYear()}:${pad(past.getMonth()+1)}:${pad(past.getDate())} ${pad(past.getHours())}:${pad(past.getMinutes())}:${pad(past.getSeconds())}`;

  const zeroth = {};
  zeroth[piexif.ImageIFD.Make] = make;
  zeroth[piexif.ImageIFD.Model] = model;
  zeroth[piexif.ImageIFD.Software] = soft;
  zeroth[piexif.ImageIFD.DateTime] = dt;
  zeroth[piexif.ImageIFD.Orientation] = 1;
  zeroth[piexif.ImageIFD.XResolution] = [72, 1];
  zeroth[piexif.ImageIFD.YResolution] = [72, 1];
  zeroth[piexif.ImageIFD.ResolutionUnit] = 2;
  zeroth[piexif.ImageIFD.Artist] = "Stardom_" + randomString(5);
  zeroth[piexif.ImageIFD.Copyright] = `© ${past.getFullYear()}`;

  const exif = {};
  exif[piexif.ExifIFD.DateTimeOriginal] = dt;
  exif[piexif.ExifIFD.DateTimeDigitized] = dt;
  exif[piexif.ExifIFD.ExifVersion] = "0232";
  exif[piexif.ExifIFD.ISOSpeedRatings] = randomChoice([100, 200, 400, 800, 1600]);
  exif[piexif.ExifIFD.ExposureTime] = randomChoice([[1,60],[1,125],[1,250],[1,500]]);
  exif[piexif.ExifIFD.FNumber] = [28, 10];
  exif[piexif.ExifIFD.FocalLength] = [50, 1];
  exif[piexif.ExifIFD.ImageUniqueID] = crypto.randomUUID().replace(/-/g, "").toUpperCase();
  exif[piexif.ExifIFD.BodySerialNumber] = randomString(12).toUpperCase();

  return piexif.dump({ "0th": zeroth, "Exif": exif, "GPS": {}, "1st": {}, "thumbnail": null });
}

async function processPhoto(file, mode) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const quality = document.getElementById("optQuality").checked ? 0.95 : 0.9;

        canvas.toBlob(async (blob) => {
          if (!blob) return reject(new Error("Failed to create image"));

          if (mode === "pure") {
            resolve(blob);
            return;
          }

          try {
            const dataUrl = await blobToDataURL(blob);
            const exifBytes = generateUniqueExif(img.naturalWidth, img.naturalHeight);
            const newDataUrl = piexif.insert(exifBytes, dataUrl);
            const res = await fetch(newDataUrl);
            resolve(await res.blob());
          } catch (err) {
            console.warn("EXIF inject failed, pure clean used", err);
            resolve(blob);
          }
        }, "image/jpeg", quality);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = URL.createObjectURL(file);
  });
}

function blobToDataURL(blob) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// Videos: we can only offer a pass-through + note for now
// Full video metadata rewriting needs heavier tools (ffmpeg.wasm)
async function processVideo(file) {
  // For now return the original file.
  // In a future upgrade we can integrate ffmpeg.wasm for deep video uniquify.
  return file;
}

async function uniquifyOne(id) {
  const item = queue.find(i => i.id === id);
  if (!item) return;

  const btn = event.currentTarget;
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;

  try {
    let blob;
    if (item.type === "photo") {
      blob = await processPhoto(item.file, currentMode);
    } else {
      blob = await processVideo(item.file);
      showStatus("Video added to library. Full video metadata uniquify coming in next upgrade.", "info");
    }

    const keepName = document.getElementById("optKeepName").checked;
    const base = item.name.replace(/\.[^/.]+$/, "");
    const ext = item.type === "video" ? (item.name.split(".").pop() || "mp4") : "jpg";
    const filename = keepName
      ? `${base}_uniquified.${ext}`
      : `${base}_uniquified_${crypto.randomUUID().slice(0, 6)}.${ext}`;

    // Download
    triggerDownload(blob, filename);

    // Add to library
    const thumb = item.type === "photo" ? await createThumb(item.url) : null;
    library.unshift({
      id: crypto.randomUUID(),
      name: filename,
      type: item.type,
      originalName: item.name,
      createdAt: Date.now(),
      mode: currentMode,
      thumb,
      size: blob.size
    });
    saveLibrary();

    showStatus(`Uniquified: ${filename}`, "success");
  } catch (err) {
    console.error(err);
    showStatus("Error: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

async function uniquifyAll() {
  if (!queue.length) return;
  const btn = document.getElementById("uniquifyAllBtn");
  btn.disabled = true;

  for (let i = 0; i < queue.length; i++) {
    btn.innerHTML = `<span class="spinner"></span> ${i + 1}/${queue.length}`;
    // Simulate clicking each
    const item = queue[i];
    try {
      let blob;
      if (item.type === "photo") {
        blob = await processPhoto(item.file, currentMode);
      } else {
        blob = await processVideo(item.file);
      }

      const base = item.name.replace(/\.[^/.]+$/, "");
      const ext = item.type === "video" ? (item.name.split(".").pop() || "mp4") : "jpg";
      const filename = `${base}_uniquified_${crypto.randomUUID().slice(0, 5)}.${ext}`;
      triggerDownload(blob, filename);

      const thumb = item.type === "photo" ? await createThumb(item.url) : null;
      library.unshift({
        id: crypto.randomUUID(),
        name: filename,
        type: item.type,
        originalName: item.name,
        createdAt: Date.now(),
        mode: currentMode,
        thumb,
        size: blob.size
      });

      // Small delay so mobile doesn't block downloads
      await sleep(350);
    } catch (err) {
      console.error(err);
    }
  }

  saveLibrary();
  btn.disabled = false;
  btn.innerHTML = "⚡ Uniquify All";
  showStatus(`Finished uniquifying ${queue.length} item(s)`, "success");
}

function triggerDownload(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function createThumb(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 200;
      const scale = Math.max(size / img.width, size / img.height);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// -------------------- Library Rendering --------------------
function renderLibrary() {
  const grid = document.getElementById("libraryGrid");
  const empty = document.getElementById("libraryEmpty");
  const dayValue = document.getElementById("dayFilter").value;
  const minTime = getDayRange(dayValue);

  let items = [...library];

  if (typeFilter !== "all") {
    items = items.filter(i => i.type === typeFilter);
  }

  if (minTime !== null) {
    if (dayValue === "yesterday") {
      const startToday = new Date();
      startToday.setHours(0,0,0,0);
      const startYesterday = startToday.getTime() - 86400000;
      items = items.filter(i => i.createdAt >= startYesterday && i.createdAt < startToday.getTime());
    } else {
      items = items.filter(i => i.createdAt >= minTime);
    }
  }

  if (!items.length) {
    grid.classList.add("hidden");
    empty.classList.remove("hidden");
    empty.querySelector("h3").textContent = library.length ? "No matches for this filter" : "Your library is empty";
    empty.querySelector("p").textContent = library.length
      ? "Try changing the photo/video or day filter."
      : "Uniquify some media and it will appear here, filtered by day.";
    return;
  }

  empty.classList.add("hidden");
  grid.classList.remove("hidden");

  grid.innerHTML = items.map(item => {
    const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
    return `
      <div class="media-card">
        <div class="media-thumb">
          ${item.thumb
            ? `<img src="${item.thumb}" alt="" loading="lazy" />`
            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--dim);font-size:2rem;">▶</div>`}
          <span class="media-badge ${item.type === "video" ? "badge-video" : "badge-photo"}">
            ${item.type}
          </span>
        </div>
        <div class="media-body">
          <div class="media-name" title="${item.name}">${item.name}</div>
          <div class="media-date">${dateStr} · ${item.mode === "inject" ? "Unique meta" : "Pure"}</div>
        </div>
      </div>
    `;
  }).join("");
}

// -------------------- Status --------------------
function showStatus(msg, type = "info") {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = `status show ${type}`;
  clearTimeout(showStatus._t);
  showStatus._t = setTimeout(() => el.classList.remove("show"), 4500);
}

// Init
renderLibrary();
