/**
 * Metadata Changer Pro - Browser version
 * Deep clean + optional unique realistic metadata injection
 * Designed for mobile + desktop, Vercel-ready
 */

let currentMode = "inject"; // "inject" | "pure"
let files = []; // { id, file, url, cleanedBlob? }

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const gallery = document.getElementById("gallery");
const bulkBar = document.getElementById("bulkBar");
const statusEl = document.getElementById("status");

// -------------------- Mode --------------------
function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll(".mode-card").forEach(card => {
    card.classList.toggle("active", card.dataset.mode === mode);
  });
}

// -------------------- Upload Handling --------------------
dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener("change", (e) => handleFiles(e.target.files));

function handleFiles(fileList) {
  const newFiles = Array.from(fileList).filter(f => f.type.startsWith("image/"));
  if (!newFiles.length) {
    showStatus("No valid images selected", "info");
    return;
  }

  newFiles.forEach(file => {
    const id = crypto.randomUUID();
    const url = URL.createObjectURL(file);
    files.push({ id, file, url });
  });

  renderGallery();
  bulkBar.classList.remove("hidden");
  showStatus(`${newFiles.length} image(s) added • Total: ${files.length}`, "success");
}

function clearAll() {
  files.forEach(f => URL.revokeObjectURL(f.url));
  files = [];
  gallery.innerHTML = "";
  bulkBar.classList.add("hidden");
  fileInput.value = "";
  showStatus("Cleared", "info");
}

// -------------------- Rendering --------------------
function renderGallery() {
  gallery.innerHTML = "";
  files.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${item.url}" alt="${item.file.name}" loading="lazy" />
      <div class="card-body">
        <div class="card-name" title="${item.file.name}">${item.file.name}</div>
        <button class="btn btn-primary" onclick="downloadOne('${item.id}')">
          ⬇️ Download Cleaned
        </button>
      </div>
    `;
    gallery.appendChild(card);
  });
}

// -------------------- Core Processing --------------------
function showStatus(msg, type = "info") {
  statusEl.textContent = msg;
  statusEl.className = `status show ${type}`;
  setTimeout(() => statusEl.classList.remove("show"), 4000);
}

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
  // Realistic camera data
  const cameras = [
    ["Apple", "iPhone 15 Pro Max"],
    ["Apple", "iPhone 14 Pro"],
    ["Canon", "Canon EOS R5"],
    ["Canon", "Canon EOS R6"],
    ["Sony", "Sony ILCE-7M4"],
    ["Nikon", "NIKON Z 8"],
    ["Samsung", "SM-S928B"],
    ["Google", "Pixel 8 Pro"],
    ["Fujifilm", "X-T5"]
  ];
  const software = [
    "Adobe Photoshop 25.0 (Windows)",
    "Adobe Lightroom Classic 13.2",
    "Apple Photos 10.0",
    "Google Photos",
    "Capture One 16"
  ];

  const [make, model] = randomChoice(cameras);
  const soft = randomChoice(software);
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * 800 * 24 * 60 * 60 * 1000);
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
  zeroth[piexif.ImageIFD.Artist] = "User_" + randomString(6);
  zeroth[piexif.ImageIFD.Copyright] = `© ${past.getFullYear()}`;

  const exif = {};
  exif[piexif.ExifIFD.DateTimeOriginal] = dt;
  exif[piexif.ExifIFD.DateTimeDigitized] = dt;
  exif[piexif.ExifIFD.ExifVersion] = "0232";
  exif[piexif.ExifIFD.ISOSpeedRatings] = randomChoice([100, 200, 400, 800, 1600]);
  exif[piexif.ExifIFD.ExposureTime] = randomChoice([[1, 60], [1, 125], [1, 250], [1, 500]]);
  exif[piexif.ExifIFD.FNumber] = [28, 10];
  exif[piexif.ExifIFD.FocalLength] = [50, 1];
  exif[piexif.ExifIFD.ImageUniqueID] = crypto.randomUUID().replace(/-/g, "").toUpperCase();
  exif[piexif.ExifIFD.BodySerialNumber] = randomString(12).toUpperCase();

  const exifObj = { "0th": zeroth, "Exif": exif, "GPS": {}, "1st": {}, "thumbnail": null };
  return piexif.dump(exifObj);
}

/**
 * Deep clean by drawing to canvas.
 * This is one of the strongest browser methods to destroy
 * most metadata including many C2PA / AI signature segments.
 */
async function processImage(file, mode) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");

        // Draw → this drops almost all non-pixel data
        ctx.drawImage(img, 0, 0);

        const quality = document.getElementById("optQuality").checked ? 0.95 : 0.92;

        if (mode === "pure") {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          }, "image/jpeg", quality);
        } else {
          // Inject unique metadata using piexifjs
          canvas.toBlob(async (blob) => {
            if (!blob) return reject(new Error("Failed to create blob"));

            try {
              const arrayBuffer = await blob.arrayBuffer();
              const dataUrl = await new Promise(r => {
                const reader = new FileReader();
                reader.onload = () => r(reader.result);
                reader.readAsDataURL(blob);
              });

              // Generate unique EXIF every time if option is on
              const uniqueEvery = document.getElementById("optUniqueEveryTime").checked;
              // Always generate new for now when in inject mode
              const exifBytes = generateUniqueExif(img.naturalWidth, img.naturalHeight);

              const newDataUrl = piexif.insert(exifBytes, dataUrl);
              // Convert dataURL back to blob
              const res = await fetch(newDataUrl);
              const finalBlob = await res.blob();
              resolve(finalBlob);
            } catch (err) {
              // Fallback: just return clean jpeg if piexif fails
              console.warn("EXIF inject failed, returning pure clean", err);
              resolve(blob);
            }
          }, "image/jpeg", quality);
        }
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = URL.createObjectURL(file);
  });
}

// -------------------- Download Actions --------------------
async function downloadOne(id) {
  const item = files.find(f => f.id === id);
  if (!item) return;

  const btn = event.currentTarget;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Cleaning...`;

  try {
    const blob = await processImage(item.file, currentMode);
    const keepName = document.getElementById("optKeepName").checked;
    const base = item.file.name.replace(/\.[^/.]+$/, "");
    const name = keepName
      ? `${base}_cleaned.jpg`
      : `${base}_clean_${crypto.randomUUID().slice(0, 6)}.jpg`;

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);

    showStatus("Downloaded with unique clean metadata", "success");
  } catch (err) {
    console.error(err);
    showStatus("Error: " + err.message, "info");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

async function downloadAll() {
  if (!files.length) return;

  const btn = document.getElementById("bulkBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Processing ${files.length}...`;

  try {
    // For simplicity on mobile we process sequentially and trigger downloads
    // (true ZIP in pure browser is heavier; sequential is more reliable on mobile)
    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      btn.innerHTML = `<span class="spinner"></span> ${i + 1}/${files.length}`;
      const blob = await processImage(item.file, currentMode);
      const base = item.file.name.replace(/\.[^/.]+$/, "");
      const name = `${base}_clean_${crypto.randomUUID().slice(0, 5)}.jpg`;

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);

      // Small delay so mobile browsers don't block multiple downloads
      await new Promise(r => setTimeout(r, 400));
    }
    showStatus(`All ${files.length} images cleaned & downloaded`, "success");
  } catch (err) {
    showStatus("Error during bulk: " + err.message, "info");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "📦 Download All Cleaned";
  }
}

// Prevent accidental navigation away while files are loaded
window.addEventListener("beforeunload", (e) => {
  if (files.length > 0) {
    e.preventDefault();
    e.returnValue = "";
  }
});
