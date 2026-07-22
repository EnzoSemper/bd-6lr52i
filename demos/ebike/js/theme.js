// theme.js
function initTheme() {
  const checkbox = document.getElementById('themeToggleCheckbox');
  const currentTheme = localStorage.getItem('aeglos_theme') || 'dark';

  if (currentTheme === 'light') {
    document.documentElement.classList.add('theme-light');
    if (checkbox) checkbox.checked = true;
  }

  if (checkbox) {
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.documentElement.classList.add('theme-light');
        localStorage.setItem('aeglos_theme', 'light');
      } else {
        document.documentElement.classList.remove('theme-light');
        localStorage.setItem('aeglos_theme', 'dark');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initTheme);


// Fetch live news for marquees
document.addEventListener('DOMContentLoaded', () => {
    const marquees = document.querySelectorAll('.scrolling-text');
    if (marquees.length > 0) {
        fetch('/api/news')
            .then(r => r.json())
            .then(data => {
                if (data && data.news) {
                    marquees.forEach(m => m.innerHTML = data.news);
                }
            })
            .catch(err => console.error('Failed to fetch news', err));
    }
});
