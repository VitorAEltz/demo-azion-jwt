// JWT Authentication Demo - Frontend JavaScript

class JWTAuth {
    constructor() {
        this.token = localStorage.getItem('jwt_token');
        this.baseURL = window.location.origin;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthState();
    }

    bindEvents() {
        // Navigation and modal controls
        document.getElementById('auth-btn').addEventListener('click', () => this.openModal());
        document.getElementById('signin-btn').addEventListener('click', () => this.openModal());
        document.getElementById('signup-btn').addEventListener('click', () => this.openModal());
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        
        // Tab switching
        document.getElementById('signin-tab').addEventListener('click', () => this.switchTab('signin'));
        document.getElementById('signup-tab').addEventListener('click', () => this.switchTab('signup'));
        
        // Form submissions
        document.getElementById('signin-form').addEventListener('submit', (e) => this.handleSignIn(e));
        document.getElementById('signup-form').addEventListener('submit', (e) => this.handleSignUp(e));
        
        // Dashboard actions
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        document.getElementById('test-public').addEventListener('click', () => this.testPublicRoute());
        document.getElementById('test-protected').addEventListener('click', () => this.testProtectedRoute());
        document.getElementById('show-token').addEventListener('click', () => this.showTokenDetails());
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('auth-modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    checkAuthState() {
        if (this.token) {
            this.showDashboard();
        } else {
            this.showHomePage();
        }
    }

    openModal() {
        document.getElementById('auth-modal').style.display = 'block';
        this.switchTab('signin');
    }

    closeModal() {
        document.getElementById('auth-modal').style.display = 'none';
        this.clearErrors();
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');
        
        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        document.getElementById(`${tab}-form`).classList.add('active');
        
        this.clearErrors();
    }

    clearErrors() {
        document.getElementById('signin-error').textContent = '';
        document.getElementById('signup-error').textContent = '';
    }

    async handleSignIn(e) {
        e.preventDefault();
        
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;
        const errorElement = document.getElementById('signin-error');
        
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                this.token = data.token;
                localStorage.setItem('jwt_token', this.token);
                this.closeModal();
                this.showDashboard();
                this.showSuccessMessage('Successfully signed in!');
            } else {
                errorElement.textContent = data.message || 'Invalid credentials';
            }
        } catch (error) {
            errorElement.textContent = 'Network error. Please try again.';
            console.error('Sign in error:', error);
        }
    }

    async handleSignUp(e) {
        e.preventDefault();
        
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;
        const errorElement = document.getElementById('signup-error');
        
        // Basic validation
        if (password !== confirmPassword) {
            errorElement.textContent = 'Passwords do not match';
            return;
        }
        
        if (password.length < 6) {
            errorElement.textContent = 'Password must be at least 6 characters';
            return;
        }
        
        // For demo purposes, show message about predefined credentials
        errorElement.innerHTML = `
            <strong>Demo Limitation:</strong><br>
            This demo only accepts: user1@test.com / My_Pass*<br>
            Please use the Sign In tab with these credentials.
        `;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('jwt_token');
        this.showHomePage();
        this.showSuccessMessage('Successfully logged out!');
    }

    showHomePage() {
        document.getElementById('home').style.display = 'block';
        document.getElementById('features').style.display = 'block';
        document.getElementById('about').style.display = 'block';
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('auth-btn').textContent = 'Sign In';
        document.getElementById('auth-btn').style.display = 'block';
    }

    showDashboard() {
        document.getElementById('home').style.display = 'none';
        document.getElementById('features').style.display = 'none';
        document.getElementById('about').style.display = 'none';
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('auth-btn').textContent = 'Dashboard';
        
        // Update user info
        this.updateUserInfo();
    }

    updateUserInfo() {
        if (this.token) {
            try {
                const payload = this.parseJWT(this.token);
                document.getElementById('user-email').textContent = payload.sub || 'user1@test.com';
                document.getElementById('user-role').textContent = payload.role || 'Admin';
                
                // Check token expiration
                const now = Math.floor(Date.now() / 1000);
                const isExpired = payload.exp && payload.exp < now;
                
                const statusElement = document.getElementById('token-status');
                if (isExpired) {
                    statusElement.textContent = 'Expired';
                    statusElement.style.color = '#ef4444';
                } else {
                    statusElement.textContent = 'Active';
                    statusElement.style.color = '#10b981';
                }
            } catch (error) {
                console.error('Error parsing token:', error);
            }
        }
    }

    parseJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error parsing JWT:', error);
            return {};
        }
    }

    async testPublicRoute() {
        const resultElement = document.getElementById('public-result');
        
        try {
            const response = await fetch(`${this.baseURL}/public`);
            const data = await response.json();
            
            resultElement.textContent = JSON.stringify(data, null, 2);
            resultElement.style.borderLeftColor = response.ok ? '#10b981' : '#ef4444';
        } catch (error) {
            resultElement.textContent = `Error: ${error.message}`;
            resultElement.style.borderLeftColor = '#ef4444';
        }
    }

    async testProtectedRoute() {
        const resultElement = document.getElementById('protected-result');
        
        if (!this.token) {
            resultElement.textContent = 'No token available. Please sign in first.';
            resultElement.style.borderLeftColor = '#ef4444';
            return;
        }
        
        try {
            const response = await fetch(`${this.baseURL}/protected`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                resultElement.textContent = JSON.stringify(data, null, 2);
                resultElement.style.borderLeftColor = '#10b981';
            } else {
                resultElement.textContent = `Error ${response.status}: ${data.message}`;
                resultElement.style.borderLeftColor = '#ef4444';
                
                // If token is invalid, logout user
                if (response.status === 401) {
                    setTimeout(() => this.logout(), 2000);
                }
            }
        } catch (error) {
            resultElement.textContent = `Network Error: ${error.message}`;
            resultElement.style.borderLeftColor = '#ef4444';
        }
    }

    showTokenDetails() {
        const resultElement = document.getElementById('token-details');
        
        if (!this.token) {
            resultElement.textContent = 'No token available.';
            resultElement.style.borderLeftColor = '#ef4444';
            return;
        }
        
        try {
            const parts = this.token.split('.');
            const header = JSON.parse(atob(parts[0]));
            const payload = this.parseJWT(this.token);
            
            const tokenInfo = {
                header: header,
                payload: payload,
                token_preview: `${this.token.substring(0, 20)}...${this.token.substring(this.token.length - 20)}`,
                expires_at: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'No expiration'
            };
            
            resultElement.textContent = JSON.stringify(tokenInfo, null, 2);
            resultElement.style.borderLeftColor = '#4f46e5';
        } catch (error) {
            resultElement.textContent = `Error parsing token: ${error.message}`;
            resultElement.style.borderLeftColor = '#ef4444';
        }
    }

    showSuccessMessage(message) {
        // Create a temporary success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JWTAuth();
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
