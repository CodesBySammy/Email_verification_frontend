// Configuration - Update with your Vercel deployment URL
const API_BASE_URL = 'https://email-verification-api-psi.vercel.app/'; // Replace with your actual Vercel URL

// Global variables
let countdownInterval;
let userEmail = '';

// DOM Elements
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const loading = document.getElementById('loading');
const emailInput = document.getElementById('email');
const emailDisplay = document.getElementById('emailDisplay');
const verifiedEmail = document.getElementById('verifiedEmail');
const emailError = document.getElementById('emailError');
const otpError = document.getElementById('otpError');
const countdownElement = document.getElementById('countdown');

// Initialize the application
function init() {
    // Focus on email input when page loads
    emailInput.focus();
    
    // Add event listener for Enter key in email input
    emailInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendOTP();
        }
    });
}

// Send OTP to the provided email
async function sendOTP() {
    const email = emailInput.value.trim();
    
    // Validate email
    if (!validateEmail(email)) {
        emailError.textContent = 'Please enter a valid email address';
        return;
    }
    
    emailError.textContent = '';
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/otp/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            userEmail = email;
            emailDisplay.textContent = email;
            switchStep(1, 2);
            startTimer(10 * 60); // 10 minutes timer
            focusOnFirstOtpInput();
        } else {
            emailError.textContent = data.message || 'Failed to send OTP';
        }
    } catch (error) {
        emailError.textContent = 'Network error. Please try again.';
        console.error('Error sending OTP:', error);
    } finally {
        showLoading(false);
    }
}

// Verify the entered OTP
async function verifyOTP() {
    const otp = getOtpValue();
    
    if (otp.length !== 6) {
        otpError.textContent = 'Please enter the complete 6-digit code';
        return;
    }
    
    otpError.textContent = '';
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/otp/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: userEmail, 
                otp 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            clearInterval(countdownInterval);
            verifiedEmail.textContent = userEmail;
            switchStep(2, 3);
        } else {
            otpError.textContent = data.message || 'Invalid verification code';
            shakeOtpInputs();
        }
    } catch (error) {
        otpError.textContent = 'Network error. Please try again.';
        console.error('Error verifying OTP:', error);
    } finally {
        showLoading(false);
    }
}

// Resend OTP
async function resendOTP() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/otp/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: userEmail })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resetOtpInputs();
            startTimer(10 * 60);
            focusOnFirstOtpInput();
            otpError.textContent = '';
        } else {
            otpError.textContent = data.message || 'Failed to resend OTP';
        }
    } catch (error) {
        otpError.textContent = 'Network error. Please try again.';
        console.error('Error resending OTP:', error);
    } finally {
        showLoading(false);
    }
}

// Change email address
function changeEmail() {
    clearInterval(countdownInterval);
    userEmail = '';
    switchStep(2, 1);
    emailInput.focus();
}

// Reset the form to verify another email
function resetForm() {
    userEmail = '';
    emailInput.value = '';
    resetOtpInputs();
    switchStep(3, 1);
    emailInput.focus();
}

// Helper function to validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper function to get the complete OTP value
function getOtpValue() {
    let otp = '';
    for (let i = 1; i <= 6; i++) {
        otp += document.getElementById(`otp${i}`).value;
    }
    return otp;
}

// Helper function to reset OTP inputs
function resetOtpInputs() {
    for (let i = 1; i <= 6; i++) {
        document.getElementById(`otp${i}`).value = '';
    }
}

// Helper function to focus on the first OTP input
function focusOnFirstOtpInput() {
    document.getElementById('otp1').focus();
}

// Helper function to switch between steps
function switchStep(fromStep, toStep) {
    document.getElementById(`step${fromStep}`).style.display = 'none';
    document.getElementById(`step${toStep}`).style.display = 'block';
}

// Helper function to show/hide loading state
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
}

// Start the countdown timer
function startTimer(duration) {
    clearInterval(countdownInterval);
    
    let timer = duration;
    updateTimerDisplay(timer);
    
    countdownInterval = setInterval(() => {
        timer--;
        updateTimerDisplay(timer);
        
        if (timer <= 0) {
            clearInterval(countdownInterval);
            otpError.textContent = 'Verification code has expired';
        }
    }, 1000);
}

// Update the timer display
function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    countdownElement.textContent = `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    
    // Change color when time is running out
    if (seconds < 60) {
        countdownElement.parentElement.classList.add('expiring');
    } else {
        countdownElement.parentElement.classList.remove('expiring');
    }
}

// Move to next OTP input automatically
function moveToNext(current) {
    const currentInput = document.getElementById(`otp${current}`);
    const nextInput = document.getElementById(`otp${current + 1}`);
    
    if (currentInput.value && nextInput) {
        nextInput.focus();
    }
    
    // Auto-submit when last digit is entered
    if (current === 6 && currentInput.value) {
        verifyOTP();
    }
}

// Handle keyboard navigation in OTP inputs
function handleOtpNavigation(event, current) {
    const currentInput = document.getElementById(`otp${current}`);
    const prevInput = document.getElementById(`otp${current - 1}`);
    
    if (event.key === 'Backspace' && !currentInput.value && prevInput) {
        prevInput.focus();
    }
}

// Shake animation for OTP inputs on error
function shakeOtpInputs() {
    const otpInputs = document.querySelectorAll('.otp-inputs input');
    
    otpInputs.forEach(input => {
        input.classList.add('shake');
        setTimeout(() => {
            input.classList.remove('shake');
        }, 500);
    });
}

// Add shake animation to CSS
const style = document.createElement('style');
style.textContent = `
    .shake {
        animation: shake 0.5s;
        border-color: #ff4757 !important;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded

document.addEventListener('DOMContentLoaded', init);
