// Dashboard state
let dashboardData = null;
let isAuthenticated = false;

// Admin authentication
const ADMIN_PASSWORD = 'certnode-admin-2025'; // Simple password

// Check if already authenticated
function checkAuth() {
    const token = localStorage.getItem('dashboard_auth');
    if (token === 'authenticated') {
        showDashboard();
        return true;
    }
    return false;
}

// Authenticate user
function authenticate(password) {
    console.log('Checking password:', password, 'against:', ADMIN_PASSWORD);
    if (password === ADMIN_PASSWORD) {
        console.log('Authentication successful');
        localStorage.setItem('dashboard_auth', 'authenticated');
        showDashboard();
        return true;
    }
    console.log('Authentication failed');
    return false;
}

// Show dashboard content
function showDashboard() {
    document.getElementById('auth-modal').style.display = 'none';
    document.getElementById('dashboard-content').style.display = 'block';
    isAuthenticated = true;
    loadDashboard();
}

// Logout
function logout() {
    localStorage.removeItem('dashboard_auth');
    document.getElementById('auth-modal').style.display = 'flex';
    document.getElementById('dashboard-content').style.display = 'none';
    isAuthenticated = false;
}

// Handle auth form submission
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('auth-form').addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('Form submitted');
        const password = document.getElementById('admin-password').value;
        console.log('Password entered:', password);
        const success = authenticate(password);
        console.log('Authentication result:', success);

        if (!success) {
            document.getElementById('auth-error').style.display = 'block';
            document.getElementById('admin-password').value = '';
        }
    });

    // Check auth on page load
    if (!checkAuth()) {
        document.getElementById('auth-modal').style.display = 'flex';
    }
});

// Load dashboard data
async function loadDashboard() {
    if (!isAuthenticated) return;

    const metricsGrid = document.getElementById('metrics-grid');
    metricsGrid.classList.add('loading');

    try {
        // Use admin token for API access
        const adminToken = 'demo-admin-token-123';
        const response = await fetch('/api/dashboard/metrics', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        dashboardData = await response.json();

        updateMetrics(dashboardData);
        updateTierDistribution(dashboardData.subscribersByTier);
        updateRecentActivity(dashboardData);

    } catch (error) {
        console.error('Failed to load dashboard:', error);
        alert('Failed to load dashboard data. Please try again.');
    } finally {
        metricsGrid.classList.remove('loading');
    }
}

// Update main metrics
function updateMetrics(data) {
    document.getElementById('total-subscribers').textContent = data.totalSubscribers.toLocaleString();
    document.getElementById('active-trials').textContent = data.activeTrials.toLocaleString();
    document.getElementById('conversion-rate').textContent = data.trialToSubscriberConversionRate + '%';
    document.getElementById('mrr').textContent = '$' + data.monthlyRecurringRevenue.toLocaleString();
    document.getElementById('churn-rate').textContent = data.churnRate + '%';

    // Health score with color coding
    const healthScore = data.healthScore;
    const healthElement = document.getElementById('health-score');
    healthElement.textContent = healthScore;

    healthElement.className = 'health-score ';
    if (healthScore >= 80) healthElement.className += 'health-excellent';
    else if (healthScore >= 60) healthElement.className += 'health-good';
    else if (healthScore >= 40) healthElement.className += 'health-warning';
    else healthElement.className += 'health-poor';

    // Growth indicators
    document.getElementById('subscribers-change').innerHTML =
        `<span class="positive">+${data.newSubscribersThisMonth} this month</span>`;
    document.getElementById('trials-change').innerHTML =
        `<span class="positive">+${data.newTrialsThisMonth} this month</span>`;
}

// Update tier distribution visualization
function updateTierDistribution(tiers) {
    const total = Object.values(tiers).reduce((sum, count) => sum + count, 0);
    const tierBar = document.getElementById('tier-distribution');

    if (total === 0) {
        tierBar.innerHTML = '<div style="padding: 1rem; text-align: center; color: #64748b;">No subscribers yet</div>';
        return;
    }

    tierBar.innerHTML = '';

    Object.entries(tiers).forEach(([tier, count]) => {
        if (count > 0) {
            const percentage = (count / total) * 100;
            const segment = document.createElement('div');
            segment.className = `tier-segment tier-${tier}`;
            segment.style.width = percentage + '%';
            segment.textContent = count;
            segment.title = `${tier}: ${count} subscribers (${percentage.toFixed(1)}%)`;
            tierBar.appendChild(segment);
        }
    });

    // Update individual counts
    document.getElementById('free-count').textContent = tiers.free;
    document.getElementById('starter-count').textContent = tiers.starter;
    document.getElementById('pro-count').textContent = tiers.pro;
    document.getElementById('business-count').textContent = tiers.business;
    document.getElementById('enterprise-count').textContent = tiers.enterprise;
}

// Update recent activity
function updateRecentActivity(data) {
    // Recent subscriptions
    const subscriptionsElement = document.getElementById('recent-subscriptions');
    if (data.recentSubscriptions.length === 0) {
        subscriptionsElement.innerHTML = '<div style="padding: 1rem; color: #64748b;">No recent subscriptions</div>';
    } else {
        subscriptionsElement.innerHTML = data.recentSubscriptions.map(sub => `
            <div class="activity-item">
                <div style="display: flex; align-items: center;">
                    <div class="status-indicator status-active"></div>
                    <span>${sub.tier} subscription</span>
                </div>
                <span style="font-size: 0.85rem; color: #64748b;">
                    ${new Date(sub.created_at).toLocaleDateString()}
                </span>
            </div>
        `).join('');
    }

    // Enterprise prospects
    const prospectsElement = document.getElementById('enterprise-prospects');
    if (data.enterpriseProspects.length === 0) {
        prospectsElement.innerHTML = '<div style="padding: 1rem; color: #64748b;">No enterprise prospects</div>';
    } else {
        prospectsElement.innerHTML = data.enterpriseProspects.map(prospect => `
            <div class="activity-item">
                <div style="display: flex; align-items: center;">
                    <div class="status-indicator status-trial"></div>
                    <span>${prospect.tier || 'Trial'} - ${prospect.total_usage || prospect.usage || 0} requests</span>
                </div>
                <span style="font-size: 0.85rem; color: #64748b;">High value</span>
            </div>
        `).join('');
    }
}

// Export data
async function exportData() {
    if (!isAuthenticated) {
        alert('Authentication required');
        return;
    }

    try {
        const adminToken = 'demo-admin-token-123';
        const response = await fetch('/api/dashboard/export', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'certnode-analytics.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
    }
}

// Refresh dashboard manually (for testing)
function refreshDashboard() {
    loadDashboard();
}

// Auto-refresh every 5 minutes
setInterval(loadDashboard, 5 * 60 * 1000);

// Load dashboard on page load
window.addEventListener('load', loadDashboard);