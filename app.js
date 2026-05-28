// --- SPA Routing ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
}

// --- DOM Elements ---
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// --- Event Listeners ---
sendBtn.addEventListener('click', handleSend);

userInput.addEventListener('keypress', function(e) {
    // Shift+Enter দিলে নতুন লাইন হবে, শুধু Enter দিলে মেসেজ সেন্ড হবে
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

// --- Core Logic ---
async function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;

    // ১. ইউজারের মেসেজ স্ক্রিনে দেখাও
    addMessage(text, 'user');
    userInput.value = ''; // ইনপুট বক্স খালি করো

    // ২. লোডিং মেসেজ দেখাও
    const loadingId = addMessage('Thinking...', 'ai', true);

    try {
        // ৩. Netlify সার্ভারলেস ব্যাকএন্ডে রিকোয়েস্ট পাঠাও
        const response = await fetch('/.netlify/functions/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text })
        });

        const data = await response.json();
        
        // ৪. লোডিং মেসেজ মুছে ফেলো
        document.getElementById(loadingId).remove();
        
        // ৫. Claude-এর আসল রেসপন্স দেখাও
        if (data.error) {
            addMessage('Error: ' + data.error, 'error');
        } else {
            addMessage(data.reply, 'ai');
        }

    } catch (error) {
        document.getElementById(loadingId).remove();
        addMessage('Connection failed. Backend is not responding.', 'error');
    }
}

// --- Helper: Add Message to UI ---
function addMessage(text, sender, isLoading = false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', `${sender}-message`);
    
    const msgId = 'msg-' + Date.now();
    msgDiv.id = msgId;

    msgDiv.textContent = text;
    
    if (isLoading) {
        msgDiv.classList.add('loading');
    }

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // স্ক্রল একদম নিচে নিয়ে যাও
    return msgId;
}

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
    switchTab('chat-tab'); // ডিফল্টভাবে চ্যাট ট্যাব ওপেন থাকবে
});