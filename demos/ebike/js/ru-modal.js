const ruModalCSS = `
<style>
.ru-modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  z-index: 10000; display: none;
  opacity: 0; transition: opacity 0.2s;
}
.ru-modal-overlay.active { display: block; opacity: 1; }
.ru-modal {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.95);
  background: #18181a; border: 1px solid var(--border);
  border-radius: var(--radius); width: 90%; max-width: 400px;
  z-index: 10001; display: none; opacity: 0;
  transition: all 0.2s; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}
.ru-modal.active { display: block; opacity: 1; transform: translate(-50%, -50%) scale(1); }
.ru-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.ru-modal-title { font-size: 18px; font-weight: 500; color: #fff; margin:0; }
.ru-modal-close { background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; }
.ru-modal-close:hover { color: #fff; }
.ru-textarea {
  width: 100%; background: #222; border: 1px solid var(--border);
  color: #fff; border-radius: 4px; padding: 12px; font-size: 14px;
  resize: vertical; min-height: 100px; outline: none; margin-bottom: 16px; box-sizing: border-box;
}
.ru-textarea:focus { border-color: var(--gold-dim); }
.ru-btn {
  width: 100%; background: var(--gold); border: none; color: #000;
  font-weight: 600; padding: 12px; border-radius: 4px; cursor: pointer;
}
.ru-btn:hover { background: #daba68; }
.ru-btn:disabled { opacity: 0.7; cursor: not-allowed; }
</style>
`;

const ruModalHTML = `
  <div class="ru-modal-overlay" id="ruModalOverlay" data-action="closeRUModal"></div>
  <div class="ru-modal" id="ruModal">
    <div class="ru-modal-header">
      <h3 class="ru-modal-title">Request Update</h3>
      <button class="ru-modal-close" data-action="closeRUModal">✕</button>
    </div>
    <div class="ru-modal-body">
      <label style="display:block; font-size:12px; color:var(--text-muted); margin-bottom:8px;">What would you like to see added or changed?</label>
      <textarea class="ru-textarea" id="ruText" placeholder="Missing a bike? Laws changed? Let us know."></textarea>
      <button class="ru-btn" id="ruBtn" data-action="submitRU">Send</button>
    </div>
  </div>
`;

function injectRUModal() {
  if (!document.getElementById('ruModalOverlay')) {
    document.body.insertAdjacentHTML('beforeend', ruModalCSS + ruModalHTML);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectRUModal);
} else {
  injectRUModal();
}

function openRUModal() {
  document.getElementById('ruModal').classList.add('active');
  document.getElementById('ruModalOverlay').classList.add('active');
}
function closeRUModal() {
  document.getElementById('ruModal').classList.remove('active');
  document.getElementById('ruModalOverlay').classList.remove('active');
}

async function submitRU() {
  const text = document.getElementById('ruText').value.trim();
  if (!text) return;
  const btn = document.getElementById('ruBtn');
  btn.textContent = 'Sending...';
  btn.disabled = true;
  
  try {
    const res = await fetch('/api/request-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();
    if (data.success) {
      alert('Request sent successfully! Thank you.');
      closeRUModal();
      document.getElementById('ruText').value = '';
    } else {
      alert('Failed to send request.');
    }
  } catch (e) {
    alert('Failed to send request.');
  }
  btn.textContent = 'Send';
  btn.disabled = false;
}
