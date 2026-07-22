document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('navLoginBtn');
    const dropdown = document.getElementById('loginDropdown');
    const submitBtn = document.getElementById('ddSubmit');
    const emailInput = document.getElementById('ddEmail');
    const pwInput = document.getElementById('ddPassword');
    const errorMsg = document.getElementById('ddError');
    let isOpen = false;

    // Check if user is already logged in
    const storedUser = localStorage.getItem('aeglos_user');
    if (storedUser) {
        try {
            const u = JSON.parse(storedUser);
            loginBtn.textContent = 'Logout ' + u.username;
        } catch(e) {}
    }

    loginBtn.addEventListener('click', (e) => {
        if (loginBtn.textContent.startsWith('Logout')) {
            localStorage.removeItem('aeglos_user');
            loginBtn.textContent = 'Login';
            if (window.toast) window.toast('Logged out');
            return;
        }

        isOpen = !isOpen;
        if (isOpen) {
            dropdown.style.transform = 'translateY(0)';
            dropdown.style.opacity = '1';
            dropdown.style.pointerEvents = 'auto';
            emailInput.focus();
        } else {
            dropdown.style.transform = 'translateY(-150%)';
            dropdown.style.opacity = '0';
            dropdown.style.pointerEvents = 'none';
        }
    });

    submitBtn.addEventListener('click', async () => {
        if (!emailInput.value || !pwInput.value) {
            errorMsg.textContent = 'Please enter both fields';
            return;
        }
        submitBtn.textContent = '...';
        submitBtn.disabled = true;
        errorMsg.textContent = '';
        
        try {
            const resp = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput.value, password: pwInput.value })
            });
            const data = await resp.json();
            
            if (!resp.ok) throw new Error(data.error || 'Login failed');

            // Store username for display (auth is via HttpOnly cookie, no token in localStorage)
            localStorage.setItem('aeglos_user', JSON.stringify({ username: data.username }));
            
            loginBtn.textContent = 'Logout ' + data.username;
            
            // Smoothly roll back up
            isOpen = false;
            dropdown.style.transform = 'translateY(-150%)';
            dropdown.style.opacity = '0';
            dropdown.style.pointerEvents = 'none';
            
            emailInput.value = '';
            pwInput.value = '';
        } catch (err) {
            errorMsg.textContent = err.message;
        } finally {
            submitBtn.textContent = 'Sign In';
            submitBtn.disabled = false;
        }
    });
});
