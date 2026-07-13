/**
 * ============================================
 *  TFFM Job Application — Main Script
 *  Handles: Step Navigation, Validation,
 *  Dynamic Entries, File Upload, n8n Submit
 * ============================================
 */

// ─────────────────────────────────────────────
//  🔧 CONFIGURATION — ใส่ n8n Webhook URL ที่นี่
// ─────────────────────────────────────────────
const N8N_WEBHOOK_URL = 'https://bankserver.app.n8n.cloud/webhook/a7d103d0-5034-45ea-9384-5193d99c5bab';

// ─────────────────────────────────────────────
//  DOM References
// ─────────────────────────────────────────────
const form = document.getElementById('applicationForm');
const steps = document.querySelectorAll('.form-step');
const stepperItems = document.querySelectorAll('.stepper__item');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnSubmit = document.getElementById('btnSubmit');
const resultOverlay = document.getElementById('resultOverlay');

let currentStep = 1;
const totalSteps = steps.length;
let uploadedFiles = [];

// ─────────────────────────────────────────────
//  STEP NAVIGATION
// ─────────────────────────────────────────────
function goToStep(step) {
  // Hide all steps
  steps.forEach(s => s.classList.remove('active'));
  stepperItems.forEach(s => s.classList.remove('active', 'completed'));

  // Show target step
  const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
  if (targetStep) {
    targetStep.classList.add('active');
    // Re-trigger animation
    targetStep.style.animation = 'none';
    targetStep.offsetHeight; // reflow
    targetStep.style.animation = '';
  }

  // Update stepper
  stepperItems.forEach(item => {
    const s = parseInt(item.dataset.step);
    if (s < step) {
      item.classList.add('completed');
    } else if (s === step) {
      item.classList.add('active');
    }
  });

  // Button visibility
  btnPrev.style.visibility = step === 1 ? 'hidden' : 'visible';

  if (step === totalSteps) {
    btnNext.classList.add('hidden');
    btnSubmit.classList.remove('hidden');
    buildReview();
  } else {
    btnNext.classList.remove('hidden');
    btnSubmit.classList.add('hidden');
  }

  currentStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

btnNext.addEventListener('click', () => {
  if (validateStep(currentStep)) {
    goToStep(currentStep + 1);
  }
});

btnPrev.addEventListener('click', () => {
  if (currentStep > 1) goToStep(currentStep - 1);
});

// ─────────────────────────────────────────────
//  VALIDATION
// ─────────────────────────────────────────────
function validateStep(step) {
  let valid = true;

  if (step === 1) {
    valid &= validateRequired('fullName');
    valid &= validatePhone('phone');
    valid &= validatePhone('emergencyPhone');
    valid &= validateRequired('birthDate');
    valid &= validateRequired('address');
  }

  if (step === 2) {
    valid &= validateRequired('institution');
    valid &= validateRequired('degree');
    valid &= validateGpa('gpa');
  }

  // Steps 3, 4 & 5 are optional — always valid
  if (step === 3 || step === 4 || step === 5) return true;

  return !!valid;
}

function validateRequired(id) {
  const input = document.getElementById(id);
  const errorEl = document.getElementById(`${id}-error`);
  const value = input.value.trim();

  if (!value) {
    showError(input, errorEl);
    return false;
  }
  clearError(input, errorEl);
  return true;
}

function validatePhone(id) {
  const input = document.getElementById(id);
  const errorEl = document.getElementById(`${id}-error`);
  const value = input.value.replace(/[\s\-]/g, '');

  if (!value || !/^0\d{8,9}$/.test(value)) {
    showError(input, errorEl);
    return false;
  }
  clearError(input, errorEl);
  return true;
}

function validateGpa(id) {
  const input = document.getElementById(id);
  const errorEl = document.getElementById(`${id}-error`);
  const value = parseFloat(input.value);

  if (isNaN(value) || value < 0 || value > 4) {
    showError(input, errorEl);
    return false;
  }
  clearError(input, errorEl);
  return true;
}

function validateUrl(id) {
  const input = document.getElementById(id);
  const errorEl = document.getElementById(`${id}-error`);
  const value = input.value.trim();

  if (!value) {
    showError(input, errorEl);
    return false;
  }

  try {
    new URL(value);
    clearError(input, errorEl);
    return true;
  } catch {
    showError(input, errorEl);
    return false;
  }
}

function validateFiles() {
  const errorEl = document.getElementById('fileUpload-error');
  if (uploadedFiles.length === 0) {
    errorEl.classList.add('show');
    return false;
  }
  errorEl.classList.remove('show');
  return true;
}

function showError(input, errorEl) {
  input.classList.add('error');
  input.classList.remove('success');
  if (errorEl) errorEl.classList.add('show');
}

function clearError(input, errorEl) {
  input.classList.remove('error');
  input.classList.add('success');
  if (errorEl) errorEl.classList.remove('show');
}

// Real-time validation on input
document.querySelectorAll('.form-input, .form-select').forEach(input => {
  input.addEventListener('input', () => {
    if (input.classList.contains('error')) {
      const errorEl = document.getElementById(`${input.id}-error`);
      if (input.value.trim()) {
        clearError(input, errorEl);
      }
    }
  });
});

// ─────────────────────────────────────────────
//  AUTO-CALCULATE AGE
// ─────────────────────────────────────────────
document.getElementById('birthDate').addEventListener('change', function () {
  const birthDate = new Date(this.value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  document.getElementById('age').value = age >= 0 ? age : '';
});

// ─────────────────────────────────────────────
//  DYNAMIC ENTRIES — Internship
// ─────────────────────────────────────────────
let internshipCount = 0;

document.getElementById('addInternship').addEventListener('click', () => {
  internshipCount++;
  const container = document.getElementById('internshipEntries');
  const emptyState = document.getElementById('internshipEmpty');
  emptyState.style.display = 'none';

  const card = document.createElement('div');
  card.className = 'entry-card';
  card.dataset.index = internshipCount;
  card.innerHTML = `
    <div class="entry-card__header">
      <span class="entry-card__title">🏢 การฝึกงาน #${internshipCount}</span>
      <button type="button" class="entry-card__remove" onclick="removeInternship(this)" title="ลบ">✕</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>ชื่อบริษัท</label>
        <input type="text" class="form-input intern-company" placeholder="ชื่อบริษัท" />
      </div>
      <div class="form-group">
        <label>รหัสพนักงาน</label>
        <input type="text" class="form-input intern-empId" placeholder="รหัสพนักงาน" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>ตำแหน่ง</label>
        <input type="text" class="form-input intern-position" placeholder="ตำแหน่ง" />
      </div>
      <div class="form-group">
        <label>ระยะเวลา</label>
        <input type="text" class="form-input intern-duration" placeholder="เช่น 3 เดือน" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>วันที่เริ่มฝึก</label>
        <input type="date" class="form-input intern-startDate" />
      </div>
      <div class="form-group">
        <label>วันที่ฝึกจบ</label>
        <input type="date" class="form-input intern-endDate" />
      </div>
    </div>
    <div class="form-row single">
      <div class="form-group mb-0">
        <label>รายละเอียดการทำงาน</label>
        <input type="text" class="form-input intern-jobDetail" placeholder="เช่น ช่วยงานฝ่ายผลิต ดูแลเครื่องจักร" />
      </div>
    </div>
  `;

  container.appendChild(card);
});

function removeInternship(btn) {
  const card = btn.closest('.entry-card');
  card.style.animation = 'fadeIn .2s reverse both';
  setTimeout(() => {
    card.remove();
    const container = document.getElementById('internshipEntries');
    if (container.children.length === 0) {
      document.getElementById('internshipEmpty').style.display = '';
    }
  }, 200);
}

// ─────────────────────────────────────────────
//  DYNAMIC ENTRIES — Work Experience
// ─────────────────────────────────────────────
let workCount = 0;

document.getElementById('addWork').addEventListener('click', () => {
  workCount++;
  const container = document.getElementById('workEntries');
  const emptyState = document.getElementById('workEmpty');
  emptyState.style.display = 'none';

  const card = document.createElement('div');
  card.className = 'entry-card';
  card.dataset.index = workCount;
  card.innerHTML = `
    <div class="entry-card__header">
      <span class="entry-card__title">💼 ประสบการณ์ #${workCount}</span>
      <button type="button" class="entry-card__remove" onclick="removeWork(this)" title="ลบ">✕</button>
    </div>
    <div class="form-row triple">
      <div class="form-group">
        <label>ชื่อบริษัท</label>
        <input type="text" class="form-input work-company" placeholder="ชื่อบริษัท" />
      </div>
      <div class="form-group">
        <label>รหัสพนักงาน</label>
        <input type="text" class="form-input work-empId" placeholder="รหัสพนักงาน" />
      </div>
      <div class="form-group">
        <label>ตำแหน่ง</label>
        <input type="text" class="form-input work-position" placeholder="ตำแหน่ง" />
      </div>
    </div>
    <div class="form-row single">
      <div class="form-group mb-0">
        <label>รายละเอียดการทำงาน</label>
        <input type="text" class="form-input work-jobDetail" placeholder="เช่น ดูแลระบบการผลิต ควบคุมคุณภาพ" />
      </div>
    </div>
  `;

  container.appendChild(card);
});

function removeWork(btn) {
  const card = btn.closest('.entry-card');
  card.style.animation = 'fadeIn .2s reverse both';
  setTimeout(() => {
    card.remove();
    const container = document.getElementById('workEntries');
    if (container.children.length === 0) {
      document.getElementById('workEmpty').style.display = '';
    }
  }, 200);
}

// ─────────────────────────────────────────────
//  FILE UPLOAD
// ─────────────────────────────────────────────
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileUpload');
const fileListEl = document.getElementById('fileList');

// Drag & Drop
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
  fileInput.value = ''; // reset so same file can be re-selected
});

function handleFiles(files) {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  Array.from(files).forEach(file => {
    if (!allowedTypes.includes(file.type)) {
      alert(`ไฟล์ "${file.name}" ไม่รองรับ — กรุณาใช้ PDF, JPG หรือ PNG`);
      return;
    }

    uploadedFiles.push(file);
    renderFileList();
  });

  // Clear file upload error if files exist
  if (uploadedFiles.length > 0) {
    document.getElementById('fileUpload-error').classList.remove('show');
  }
}

function renderFileList() {
  fileListEl.innerHTML = '';

  uploadedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'file-item';

    const isImage = file.type.startsWith('image/');
    let previewHtml = '';

    if (isImage) {
      const url = URL.createObjectURL(file);
      previewHtml = `<img src="${url}" alt="${file.name}" />`;
    } else {
      previewHtml = `<span class="file-icon">📄</span>`;
    }

    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

    item.innerHTML = `
      <div class="file-item__preview">${previewHtml}</div>
      <div class="file-item__info">
        <div class="file-item__name">${file.name}</div>
        <div class="file-item__size">${sizeMB} MB</div>
      </div>
      <button type="button" class="file-item__remove" onclick="removeFile(${index})" title="ลบไฟล์">✕</button>
    `;

    fileListEl.appendChild(item);
  });
}

function removeFile(index) {
  uploadedFiles.splice(index, 1);
  renderFileList();
}

// ─────────────────────────────────────────────
//  BUILD REVIEW
// ─────────────────────────────────────────────
function buildReview() {
  const reviewContent = document.getElementById('reviewContent');

  // Collect data
  const fullName = document.getElementById('fullName').value;
  const phone = document.getElementById('phone').value;
  const emergencyPhone = document.getElementById('emergencyPhone').value;
  const birthDate = document.getElementById('birthDate').value;
  const age = document.getElementById('age').value;
  const address = document.getElementById('address').value;
  const position = document.getElementById('position').value;

  const institution = document.getElementById('institution').value;
  const degree = document.getElementById('degree').value;
  const gpa = document.getElementById('gpa').value;

  const hardSkills = document.getElementById('hardSkills').value;
  const softSkills = document.getElementById('softSkills').value;
  const videoUrl = document.getElementById('videoUrl').value;

  let html = '';

  // Personal Info
  html += `
    <div class="review-section">
      <h3 class="review-section__title">👤 ข้อมูลส่วนตัว</h3>
      <dl class="review-grid">
        <dt>ชื่อ-นามสกุล</dt><dd>${escapeHtml(fullName)}</dd>
        <dt>เบอร์โทร</dt><dd>${escapeHtml(phone)}</dd>
        <dt>เบอร์ฉุกเฉิน</dt><dd>${escapeHtml(emergencyPhone)}</dd>
        <dt>วันเกิด</dt><dd>${formatDate(birthDate)}</dd>
        <dt>อายุ</dt><dd>${age} ปี</dd>
        <dt>ที่อยู่</dt><dd>${escapeHtml(address)}</dd>
        ${position ? `<dt>ตำแหน่งที่สนใจ</dt><dd>${escapeHtml(position)}</dd>` : ''}
      </dl>
    </div>
  `;

  // Education
  html += `
    <div class="review-section">
      <h3 class="review-section__title">🎓 ประวัติการศึกษาสูงสุด</h3>
      <dl class="review-grid">
        <dt>สถานศึกษา</dt><dd>${escapeHtml(institution)}</dd>
        <dt>วุฒิการศึกษา</dt><dd>${escapeHtml(degree)}</dd>
        <dt>เกรดเฉลี่ย</dt><dd>${gpa}</dd>
      </dl>
    </div>
  `;

  // Internships
  const internCards = document.querySelectorAll('#internshipEntries .entry-card');
  if (internCards.length > 0) {
    html += `<div class="review-section"><h3 class="review-section__title">🏢 ประวัติการฝึกงาน</h3>`;
    internCards.forEach((card, i) => {
      const company = card.querySelector('.intern-company').value;
      const empId = card.querySelector('.intern-empId').value;
      const pos = card.querySelector('.intern-position').value;
      const dur = card.querySelector('.intern-duration').value;
      const startD = card.querySelector('.intern-startDate').value;
      const endD = card.querySelector('.intern-endDate').value;
      const jobDetail = card.querySelector('.intern-jobDetail').value;
      html += `
        <div class="review-entry-card">
          <dl class="review-grid">
            <dt>บริษัท</dt><dd>${escapeHtml(company) || '-'}</dd>
            <dt>รหัสพนักงาน</dt><dd>${escapeHtml(empId) || '-'}</dd>
            <dt>ตำแหน่ง</dt><dd>${escapeHtml(pos) || '-'}</dd>
            <dt>ระยะเวลา</dt><dd>${escapeHtml(dur) || '-'}</dd>
            <dt>เริ่มฝึก</dt><dd>${formatDate(startD)}</dd>
            <dt>ฝึกจบ</dt><dd>${formatDate(endD)}</dd>
            <dt>รายละเอียด</dt><dd>${escapeHtml(jobDetail) || '-'}</dd>
          </dl>
        </div>
      `;
    });
    html += `</div>`;
  }

  // Work Experience
  const workCards = document.querySelectorAll('#workEntries .entry-card');
  if (workCards.length > 0) {
    html += `<div class="review-section"><h3 class="review-section__title">💼 ประสบการณ์ทำงาน</h3>`;
    workCards.forEach((card, i) => {
      const company = card.querySelector('.work-company').value;
      const empId = card.querySelector('.work-empId').value;
      const pos = card.querySelector('.work-position').value;
      const jobDetail = card.querySelector('.work-jobDetail').value;
      html += `
        <div class="review-entry-card">
          <dl class="review-grid">
            <dt>บริษัท</dt><dd>${escapeHtml(company) || '-'}</dd>
            <dt>รหัสพนักงาน</dt><dd>${escapeHtml(empId) || '-'}</dd>
            <dt>ตำแหน่ง</dt><dd>${escapeHtml(pos) || '-'}</dd>
            <dt>รายละเอียด</dt><dd>${escapeHtml(jobDetail) || '-'}</dd>
          </dl>
        </div>
      `;
    });
    html += `</div>`;
  }

  // Skills & Documents
  html += `
    <div class="review-section">
      <h3 class="review-section__title">⭐ ทักษะ</h3>
      <dl class="review-grid">
        <dt>Hard Skills</dt><dd>${escapeHtml(hardSkills)}</dd>
        <dt>Soft Skills</dt><dd>${escapeHtml(softSkills)}</dd>
      </dl>
    </div>
  `;

  // Files
  html += `
    <div class="review-section">
      <h3 class="review-section__title">📎 เอกสารแนบ</h3>
      <div class="review-files">
        ${uploadedFiles.map(f => `<span class="review-file-badge">📄 ${escapeHtml(f.name)}</span>`).join('')}
      </div>
      ${videoUrl ? `<dl class="review-grid mt-8"><dt>วิดีโอ URL</dt><dd><a href="${escapeHtml(videoUrl)}" target="_blank" rel="noopener">${escapeHtml(videoUrl)}</a></dd></dl>` : ''}
    </div>
  `;

  reviewContent.innerHTML = html;
}

// ─────────────────────────────────────────────
//  SUBMIT TO n8n
// ─────────────────────────────────────────────
btnSubmit.addEventListener('click', async () => {
  if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL === 'YOUR_N8N_WEBHOOK_URL_HERE') {
    showResult('error', 'ยังไม่ได้ตั้งค่า Webhook', 'กรุณาใส่ n8n Webhook URL ในไฟล์ script.js ที่ตัวแปร N8N_WEBHOOK_URL');
    return;
  }

  btnSubmit.classList.add('loading');
  btnSubmit.disabled = true;

  try {
    const payload = await buildPayload();

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      showResult('success', 'ส่งใบสมัครสำเร็จ! 🎉', 'ข้อมูลของคุณถูกส่งเรียบร้อยแล้ว ทางบริษัทจะติดต่อกลับภายหลัง ขอบคุณที่สนใจร่วมงานกับเรา');
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('Submit error:', error);
    showResult('error', 'เกิดข้อผิดพลาด', `ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง\n(${error.message})`);
  } finally {
    btnSubmit.classList.remove('loading');
    btnSubmit.disabled = false;
  }
});

async function buildPayload() {
  // Collect internship data
  const internships = [];
  document.querySelectorAll('#internshipEntries .entry-card').forEach(card => {
    internships.push({
      company: card.querySelector('.intern-company').value,
      employeeId: card.querySelector('.intern-empId').value,
      position: card.querySelector('.intern-position').value,
      duration: card.querySelector('.intern-duration').value,
      startDate: card.querySelector('.intern-startDate').value,
      endDate: card.querySelector('.intern-endDate').value,
      jobDetail: card.querySelector('.intern-jobDetail').value,
    });
  });

  // Collect work experience data
  const workExperience = [];
  document.querySelectorAll('#workEntries .entry-card').forEach(card => {
    workExperience.push({
      company: card.querySelector('.work-company').value,
      employeeId: card.querySelector('.work-empId').value,
      position: card.querySelector('.work-position').value,
      jobDetail: card.querySelector('.work-jobDetail').value,
    });
  });

  // Convert files to Base64
  const filesData = [];
  for (const file of uploadedFiles) {
    const base64 = await fileToBase64(file);
    filesData.push({
      name: file.name,
      type: file.type,
      size: file.size,
      data: base64,
    });
  }

  return {
    personalInfo: {
      fullName: document.getElementById('fullName').value,
      phone: document.getElementById('phone').value,
      emergencyPhone: document.getElementById('emergencyPhone').value,
      birthDate: document.getElementById('birthDate').value,
      age: parseInt(document.getElementById('age').value) || null,
      address: document.getElementById('address').value,
      position: document.getElementById('position').value || null,
    },
    education: {
      institution: document.getElementById('institution').value,
      degree: document.getElementById('degree').value,
      gpa: parseFloat(document.getElementById('gpa').value),
    },
    internships,
    workExperience,
    skills: {
      hardSkills: document.getElementById('hardSkills').value,
      softSkills: document.getElementById('softSkills').value,
    },
    documents: {
      files: filesData,
      videoUrl: document.getElementById('videoUrl').value,
    },
    submittedAt: new Date().toISOString(),
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────
//  RESULT OVERLAY
// ─────────────────────────────────────────────
function showResult(type, title, desc) {
  const icon = document.getElementById('resultIcon');
  const titleEl = document.getElementById('resultTitle');
  const descEl = document.getElementById('resultDesc');

  icon.className = 'result-card__icon ' + type;
  icon.textContent = type === 'success' ? '✓' : '✕';
  titleEl.textContent = title;
  descEl.textContent = desc;

  resultOverlay.classList.add('show');
}

// Close overlay on background click
resultOverlay.addEventListener('click', (e) => {
  if (e.target === resultOverlay) {
    resultOverlay.classList.remove('show');
  }
});

// ─────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear() + 543; // Buddhist calendar
  return `${day}/${month}/${year}`;
}
