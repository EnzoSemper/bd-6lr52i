async function aeglosTrack(type, value = null) {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value })
    });
  } catch (e) {
    // Ignore tracker errors so it never blocks the user
  }
}

// 1. Automatically track outbound links and major clicks
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (link && link.href) {
    // Track outbound external links
    if (link.hostname !== window.location.hostname && !link.href.startsWith('javascript:')) {
      aeglosTrack('click_outbound', link.href);
    }
  }

  // Track comparisons / adding to list logic if we find buttons
  const btn = e.target.closest('button, .btn');
  if (btn) {
    if (btn.textContent.toLowerCase().includes('compare') || 
        (btn.classList && btn.classList.contains('compare-btn'))) {
      const bikeName = btn.getAttribute('data-bike') || btn.closest('.card')?.querySelector('h3')?.textContent || 'Unknown Bike';
      aeglosTrack('compare_click', bikeName.trim());
    }
  }
});

// 2. Track Search Inputs (Debounced)
let searchTimeout;
document.addEventListener('input', (e) => {
  const target = e.target;
  if (target.tagName === 'INPUT' && (target.type === 'search' || target.id.toLowerCase().includes('search') || target.classList.contains('search-input'))) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (target.value.trim().length > 2) {
        aeglosTrack('search_query', target.value.trim());
      }
    }, 1500); // 1.5 seconds after they stop typing
  }
});

// 3. Track Initial Page Load
window.addEventListener('load', () => {
  aeglosTrack('page_view', window.location.pathname);
});
