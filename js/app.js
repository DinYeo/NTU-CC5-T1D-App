class App {
    constructor() {
        this.user = JSON.parse(localStorage.getItem('t1d_user')) || null;
        this.events = JSON.parse(localStorage.getItem('t1d_events')) || [];
        this.settings = JSON.parse(localStorage.getItem('t1d_settings')) || {
            mealInterval: 4, // hours
            insulinInterval: 15 // minutes
        };

        this.tapCount = 0;
        this.tapTimer = null;

        this.initElements();
        this.initListeners();
        this.initAuth(); // Initialize Auth Logic

        // Check Auth State
        if (this.user) {
            this.showApp();
        } else {
            this.showAuth();
        }

        this.loadSettingsUI();
        this.loadProfileData(); // Load custom profile data
        this.renderChart();
        this.updateStats();

        // Check health status every minute
        this.checkHealthStatus();
        setInterval(() => this.checkHealthStatus(), 60000);

        console.log('T1D App Initialized');
    }

    initElements() {
        this.braceletTrigger = document.getElementById('bracelet-trigger');
        this.gestureFeedback = document.getElementById('gesture-feedback');
        this.timelineContainer = document.getElementById('timeline-container');
        this.lastMealEl = document.getElementById('last-meal-time');
        this.lastInsulinEl = document.getElementById('last-insulin-time');

        // Views
        this.mainDashboard = document.getElementById('main-dashboard');
        this.scheduleView = document.getElementById('schedule-view');
        this.mapView = document.getElementById('map-view');
        this.profileView = document.getElementById('profile-view');

        // Feedback
        this.smartFeedback = document.getElementById('smart-feedback');

        // Settings
        this.mealIntervalInput = document.getElementById('meal-interval');
        this.insulinIntervalInput = document.getElementById('insulin-interval');

        // Auth Elements
        this.authOverlay = document.getElementById('auth-overlay');
        this.appContainer = document.getElementById('app-container');

        this.loginView = document.getElementById('login-view');
        this.signupView = document.getElementById('signup-view');

        this.loginForm = document.getElementById('login-form');
        this.signupForm = document.getElementById('signup-form');

        this.goToSignupBtn = document.getElementById('go-to-signup');
        this.goToLoginBtn = document.getElementById('go-to-login');

        // Profile Edit Elements
        this.editProfileBtn = document.getElementById('edit-profile-btn');
        this.profileFields = {
            condition: document.getElementById('profile-condition'),
            triggers: document.getElementById('profile-triggers'),
            age: document.getElementById('stat-age'),
            blood: document.getElementById('stat-blood'),
            device: document.getElementById('stat-device')
        };
    }

    initListeners() {
        // Bracelet Tap Simulation
        this.braceletTrigger.addEventListener('click', (e) => this.handleTap(e));

        // Listen for setting changes
        this.mealIntervalInput.addEventListener('change', (e) => {
            this.settings.mealInterval = parseInt(e.target.value);
            this.saveSettings();
            this.checkHealthStatus();
        });

        this.insulinIntervalInput.addEventListener('change', (e) => {
            this.settings.insulinInterval = parseInt(e.target.value);
            this.saveSettings();
            this.checkHealthStatus();
        });

        // Edit Profile Listener
        if (this.editProfileBtn) {
            this.editProfileBtn.addEventListener('click', () => this.toggleEditMode());
        }
    }

    initAuth() {
        // Toggle Views
        if (this.goToSignupBtn) {
            this.goToSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.loginView.style.display = 'none';
                this.signupView.style.display = 'block';
            });
        }

        if (this.goToLoginBtn) {
            this.goToLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.signupView.style.display = 'none';
                this.loginView.style.display = 'block';
            });
        }

        // Handle Login
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Mock Login - Any email works
            const email = this.loginForm.querySelector('input[type="email"]').value;
            this.login({ name: "Alex Doe", email: email });
        });

        // Handle Signup
        this.signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login({ name: "New User", email: "user@example.com" });
        });
    }

    login(user) {
        this.user = user;
        localStorage.setItem('t1d_user', JSON.stringify(this.user));
        this.showApp();
    }

    logout() {
        this.user = null;
        localStorage.removeItem('t1d_user');
        this.showAuth();
        // Reset View
        this.switchView('dashboard');
    }

    showApp() {
        this.authOverlay.style.display = 'none';
        this.appContainer.style.display = 'flex'; // Show main app
        // Update Name if dynamic
        // document.querySelector('.welcome-text h1 .highlight').textContent = this.user.name.split(' ')[0];
    }

    showAuth() {
        this.appContainer.style.display = 'none';
        this.authOverlay.style.display = 'flex';
    }

    loadSettingsUI() {
        if (this.mealIntervalInput) this.mealIntervalInput.value = this.settings.mealInterval;
        if (this.insulinIntervalInput) this.insulinIntervalInput.value = this.settings.insulinInterval;
    }

    handleTap(e) {
        // Visual Ripple Effect
        this.createRipple(e);

        this.tapCount++;

        if (this.tapTimer) {
            clearTimeout(this.tapTimer);
        }

        this.tapTimer = setTimeout(() => {
            if (this.tapCount === 1) {
                this.logEvent('MEAL');
                this.showFeedback('Meal Recorded (1 Tap)');
            } else if (this.tapCount >= 2) {
                this.logEvent('INSULIN');
                this.showFeedback('Insulin Recorded (2 Taps)');
            }
            this.tapCount = 0;
            this.tapTimer = null;
        }, 300); // 300ms threshold for double tap
    }

    createRipple(e) {
        const ripple = document.createElement('div');
        ripple.classList.add('ripple');
        // Center ripple on click
        const rect = this.braceletTrigger.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.style.transform = 'translate(-50%, -50%)';

        this.braceletTrigger.querySelector('.ripple-container').appendChild(ripple);

        setTimeout(() => ripple.remove(), 800);
    }

    logEvent(type) {
        const event = {
            id: Date.now(),
            type: type, // 'MEAL' or 'INSULIN'
            timestamp: new Date().getTime()
        };

        this.events.unshift(event); // Add to beginning
        this.saveData();
        this.renderChart();
        this.updateStats();
        this.checkHealthStatus();
    }

    saveData() {
        localStorage.setItem('t1d_events', JSON.stringify(this.events));
    }

    saveSettings() {
        localStorage.setItem('t1d_settings', JSON.stringify(this.settings));
    }

    renderChart() {
        const today = new Date().setHours(0, 0, 0, 0);
        const todaysEvents = this.events.filter(e => new Date(e.timestamp).setHours(0, 0, 0, 0) === today);

        // Prepare Series Data
        // Y=1 for Meals (Cyan), Y=2 for Insulin (Purple) to separate them visually on the Y axis 
        // Or keep them on same line? User said "stamps". 
        // Let's use slight Y-separation so they don't overlap if times are close.

        const mealData = todaysEvents
            .filter(e => e.type === 'MEAL')
            .map(e => [e.timestamp, 1]);

        const insulinData = todaysEvents
            .filter(e => e.type === 'INSULIN')
            .map(e => [e.timestamp, 1]);

        const options = {
            series: [
                {
                    name: "Meals",
                    data: mealData
                },
                {
                    name: "Insulin",
                    data: insulinData
                }
            ],
            chart: {
                id: 't1d-timeline',
                height: 350,
                type: 'scatter',
                fontFamily: 'Outfit, sans-serif',
                background: 'transparent',
                toolbar: { show: false },
                animations: { enabled: true }
            },
            colors: ['#06b6d4', '#8b5cf6'], // Cyan, Violet
            xaxis: {
                type: 'datetime',
                labels: {
                    style: { colors: '#9ca3af' },
                    datetimeFormatter: { hour: 'HH:mm' }
                },
                tooltip: { enabled: false },
                axisBorder: { show: false },
                axisTicks: { show: false },
                min: new Date().setHours(0, 0, 0, 0),
                max: new Date().setHours(23, 59, 59, 999)
            },
            yaxis: {
                show: false, // Hide Y axis
                min: 0,
                max: 2,
                tickAmount: 2
            },
            grid: {
                borderColor: 'rgba(255,255,255,0.05)',
                xaxis: { lines: { show: true } },
                yaxis: { lines: { show: false } },
            },
            markers: {
                size: 14,
                strokeWidth: 2,
                strokeColors: '#181920',
                hover: { size: 18 }
            },
            theme: { mode: 'dark' },
            tooltip: {
                theme: 'dark',
                x: { format: 'HH:mm' },
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                    const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                    const time = new Date(data[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const type = seriesIndex === 0 ? "Meal" : "Insulin";
                    return '<div style="padding: 10px;">' +
                        '<span><b>' + type + '</b></span><br>' +
                        '<span>Time: ' + time + '</span>' +
                        '</div>';
                }
            },
            legend: {
                labels: { colors: '#fff' },
                position: 'top'
            }
        };

        if (this.chart) {
            // Update data and range (in case day changed or data changed)
            this.chart.updateOptions({
                xaxis: {
                    min: new Date().setHours(0, 0, 0, 0),
                    max: new Date().setHours(23, 59, 59, 999)
                }
            });
            this.chart.updateSeries([
                { name: "Meals", data: mealData },
                { name: "Insulin", data: insulinData }
            ]);
        } else {
            this.timelineContainer.innerHTML = '';
            this.chart = new ApexCharts(this.timelineContainer, options);
            this.chart.render();
        }
    }

    updateStats() {
        const lastMeal = this.events.find(e => e.type === 'MEAL');
        const lastInsulin = this.events.find(e => e.type === 'INSULIN');

        this.lastMealEl.textContent = lastMeal
            ? new Date(lastMeal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--:--';

        this.lastInsulinEl.textContent = lastInsulin
            ? new Date(lastInsulin.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--:--';
    }

    showFeedback(msg) {
        this.gestureFeedback.textContent = msg;
        this.gestureFeedback.style.animation = 'none';
        this.gestureFeedback.offsetHeight; /* trigger reflow */
        this.gestureFeedback.style.animation = 'pulse 2s'; // reuse pulse animation
        this.gestureFeedback.style.color = 'var(--primary)';

        setTimeout(() => {
            this.gestureFeedback.textContent = 'Waiting for input...';
        }, 3000);
    }

    checkHealthStatus() {
        const lastMeal = this.events.find(e => e.type === 'MEAL');

        if (!lastMeal) {
            this.updateFeedbackLoop('neutral', 'Waiting for your first meal of the day.');
            return;
        }

        const now = new Date().getTime();
        const mealTime = new Date(lastMeal.timestamp).getTime();
        const minsSinceMeal = (now - mealTime) / (1000 * 60);

        // Find if insulin was taken AFTER this meal
        const insulinAfterMeal = this.events.find(e =>
            e.type === 'INSULIN' && e.timestamp > lastMeal.timestamp
        );

        if (!insulinAfterMeal) {
            // Check if we passed the threshold
            if (minsSinceMeal > this.settings.insulinInterval) {
                const overObj = Math.floor(minsSinceMeal);
                this.updateFeedbackLoop('alert', `Action Needed: You missed your insulin! It's been ${overObj} mins since your meal.`);
                return;
            } else {
                // Within window
                this.updateFeedbackLoop('warning', `Reminder: Recent meal recorded. Please take insulin within ${this.settings.insulinInterval} mins.`);
                return;
            }
        }

        this.updateFeedbackLoop('good', 'All timelines look good. Meal and Insulin synchronized.');
    }

    updateFeedbackLoop(state, msg) {
        // state: 'good', 'warning', 'alert', 'neutral'
        let icon = 'fa-check-circle';
        if (state === 'warning') icon = 'fa-circle-exclamation';
        if (state === 'alert') icon = 'fa-triangle-exclamation';
        if (state === 'neutral') icon = 'fa-info-circle';

        const html = `
            <div class="feedback-state ${state}">
                <i class="fa-solid ${icon}"></i>
                <p>${msg}</p>
            </div>
        `;

        if (this.smartFeedback) {
            this.smartFeedback.innerHTML = html;
        }
    }

    switchView(viewName) {
        // Hide all views first
        if (this.mainDashboard) this.mainDashboard.style.display = 'none';
        if (this.mapView) this.mapView.style.display = 'none';
        if (this.scheduleView) this.scheduleView.style.display = 'none';
        if (this.profileView) this.profileView.style.display = 'none';

        // Reset Nav
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

        if (viewName === 'map') {
            if (this.mapView) this.mapView.style.display = 'block';
            document.querySelectorAll('.nav-item')[2].classList.add('active');
        } else if (viewName === 'schedule') {
            if (this.scheduleView) this.scheduleView.style.display = 'block';
            document.querySelectorAll('.nav-item')[1].classList.add('active');
        } else if (viewName === 'profile') {
            if (this.profileView) this.profileView.style.display = 'block';
            document.querySelectorAll('.nav-item')[3].classList.add('active');
        } else {
            if (this.mainDashboard) this.mainDashboard.style.display = 'grid';
            document.querySelectorAll('.nav-item')[0].classList.add('active');
        }
    }

    toggleEditMode() {
        const isEditing = this.editProfileBtn.classList.contains('editing');

        if (isEditing) {
            // SAVE ACTION
            this.saveProfileData();

            // UI Updates
            this.editProfileBtn.classList.remove('editing');
            this.editProfileBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';

            // Disable Editing
            Object.values(this.profileFields).forEach(el => {
                if (el) {
                    el.contentEditable = "false";
                    el.classList.remove('editable-active');
                }
            });

        } else {
            // ENABLE EDIT ACTION
            this.editProfileBtn.classList.add('editing');
            this.editProfileBtn.innerHTML = '<i class="fa-solid fa-check"></i>'; // Checkmark for save

            // Enable Editing
            Object.values(this.profileFields).forEach(el => {
                if (el) {
                    el.contentEditable = "true";
                    el.classList.add('editable-active');
                }
            });
        }
    }

    saveProfileData() {
        const data = {
            condition: this.profileFields.condition ? this.profileFields.condition.innerText : '',
            triggers: this.profileFields.triggers ? this.profileFields.triggers.innerText : '',
            age: this.profileFields.age ? this.profileFields.age.innerText : '',
            blood: this.profileFields.blood ? this.profileFields.blood.innerText : '',
            device: this.profileFields.device ? this.profileFields.device.innerText : ''
        };

        localStorage.setItem('t1d_profile_data', JSON.stringify(data));
        // Optional feedback could go here
    }

    loadProfileData() {
        const data = JSON.parse(localStorage.getItem('t1d_profile_data'));
        if (data) {
            if (this.profileFields.condition) this.profileFields.condition.innerText = data.condition;
            if (this.profileFields.triggers) this.profileFields.triggers.innerText = data.triggers;
            if (this.profileFields.age) this.profileFields.age.innerText = data.age;
            if (this.profileFields.blood) this.profileFields.blood.innerText = data.blood;
            if (this.profileFields.device) this.profileFields.device.innerText = data.device;
        }
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
