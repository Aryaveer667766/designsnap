import { db, ref, push, onValue } from './firebase.js';

// --- VISUAL OVERHAUL SCRIPT ---
// This part of the script will run as soon as the page loads to apply the new design.

const applyVisualOverhaul = () => {
    
    // 1. Function to inject all new CSS styles into the page's <head>
    const injectStyles = () => {
        const newCSS = `
            :root {
                --brand-orange: #f39c12;
                --brand-teal: #1abc9c;
                --brand-gradient: linear-gradient(45deg, #f39c12, #e67e22);
                --dark-bg: #121212;
                --dark-card: rgba(30, 30, 30, 0.65);
                --dark-card-border: rgba(255, 255, 255, 0.1);
                --text-primary: #f0f0f0;
                --text-secondary: #a0a0a0;
            }
            * { box-sizing: border-box; }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            body {
                background-image: radial-gradient(circle at top left, rgba(243, 156, 18, 0.1), transparent 30%),
                                  radial-gradient(circle at bottom right, rgba(26, 188, 156, 0.1), transparent 30%);
                padding: 30px 15px;
            }
            .container {
                max-width: 800px;
                animation: fadeIn 0.6s ease-out;
            }
            .section-card {
                background: var(--dark-card);
                border: 1px solid var(--dark-card-border);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border-radius: 20px;
                padding: 30px;
                margin-bottom: 25px;
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
                text-align: center;
            }
            h1 {
                font-size: 2.5rem;
                font-weight: 700;
                background: var(--brand-gradient);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 40px;
            }
            h2 {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin-bottom: 20px;
            }
            button {
                background: var(--brand-gradient);
                color: #fff;
                padding: 12px 25px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 1rem;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            button:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
            }
            #photoUpload { display: none; }
            .file-upload-label {
                display: block;
                padding: 40px;
                border: 2px dashed var(--dark-card-border);
                border-radius: 15px;
                cursor: pointer;
                transition: background-color 0.2s ease, border-color 0.2s ease;
                margin-bottom: 20px;
            }
            .file-upload-label:hover {
                background-color: rgba(255, 255, 255, 0.05);
                border-color: var(--brand-orange);
            }
            .file-upload-label span {
                display: block;
                margin-top: 10px;
                color: var(--text-secondary);
            }
            #preview { gap: 15px; margin: 20px 0; }
            #preview img { width: 100px; height: 100px; border-radius: 12px; }
            .progress-container { background-color: #2c2c2c; }
            .progress-bar { background: var(--brand-gradient); height: 10px; }
            #userLink a { color: var(--brand-teal); text-decoration: none; border-bottom: 2px solid transparent; transition: border-color 0.2s ease; }
            #userLink a:hover { border-color: var(--brand-teal); }
            .chat-container { height: 450px; padding: 0; }
            #chatBox { background: rgba(0, 0, 0, 0.2); border-radius: 15px; }
            .chat-input { gap: 10px; }
            .chat-input input {
                flex: 1; padding: 12px 18px; border-radius: 25px; border: 1px solid var(--dark-card-border);
                background: rgba(0, 0, 0, 0.2); color: var(--text-primary); transition: box-shadow 0.2s ease;
            }
            .chat-input input:focus { outline: none; box-shadow: 0 0 0 3px rgba(26, 188, 156, 0.5); }
            .chat-input button { border-radius: 25px; padding: 0 25px; background: var(--brand-teal); margin-left: 0; }
            .message { box-shadow: none; }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.innerText = newCSS;
        document.head.appendChild(styleSheet);
    };

    // 2. Function to restructure the page elements into the new card layout
    const restructureDOM = () => {
        const container = document.querySelector('.container');
        const h1 = container.querySelector('h1');
        
        // --- Create Upload Card ---
        const uploadCard = document.createElement('div');
        uploadCard.className = 'section-card';
        
        const uploadH2 = document.createElement('h2');
        uploadH2.innerHTML = `<i data-feather="upload-cloud"></i>Upload Your Files`;
        
        const uploadInput = document.getElementById('photoUpload');
        const previewDiv = document.getElementById('preview');
        const uploadBtn = document.getElementById('uploadBtn');
        const progressContainer = document.getElementById('progressContainer');
        const statusMsg = document.getElementById('statusMsg');

        // Create the new file upload label
        const fileLabel = document.createElement('label');
        fileLabel.htmlFor = 'photoUpload';
        fileLabel.className = 'file-upload-label';
        fileLabel.innerHTML = `<i data-feather="image" style="width:32px; height:32px; color: var(--brand-orange);"></i><span>Drag & drop files here or click to browse</span>`;

        uploadCard.append(uploadH2, fileLabel, previewDiv, uploadBtn, progressContainer, statusMsg);
        
        // --- Create Link Card ---
        const linkCard = document.createElement('div');
        linkCard.className = 'section-card';
        const linkH2 = container.querySelector('h2'); // The "Your Link" h2
        const userLinkDiv = document.getElementById('userLink');
        linkH2.innerHTML = `<i data-feather="link"></i>Your Link`;
        linkCard.append(linkH2, userLinkDiv);
        
        // --- Create Chat Card ---
        const chatCard = document.createElement('div');
        chatCard.className = 'section-card';
        const chatH2 = container.querySelectorAll('h2')[1]; // The "Chat" h2
        const chatContainer = container.querySelector('.chat-container');
        chatH2.innerHTML = `<i data-feather="message-square"></i>Chat with Design Snap`;
        chatCard.append(chatH2, chatContainer);

        // Clear original container and append new structure
        container.innerHTML = '';
        container.append(h1, uploadCard, linkCard, chatCard);
    };

    // 3. Function to load and render the Feather icon library
    const loadIcons = () => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/feather-icons';
        script.onload = () => {
            feather.replace(); // This function finds all i[data-feather] tags and replaces them with SVG icons
        };
        document.body.appendChild(script);
    };

    // Run all the functions to apply the new design
    injectStyles();
    restructureDOM();
    loadIcons();
};

// Run the visual overhaul as soon as the basic HTML content is loaded
document.addEventListener('DOMContentLoaded', applyVisualOverhaul);


// --- ORIGINAL APP LOGIC (UNCHANGED) ---

const CLOUD_NAME = 'drt1pkzu4'; // Replace with your Cloudinary cloud name
const UPLOAD_PRESET = 'designsnap_unsigned'; // Replace with your unsigned upload preset

const uploadInput = document.getElementById('photoUpload');
const uploadBtn = document.getElementById('uploadBtn');
const statusMsg = document.getElementById('statusMsg');
const previewDiv = document.getElementById('preview');
const userLinkDiv = document.getElementById('userLink');
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');

const engagingMessages = [
    "Establishing secure connection... 🔗",
    "Encrypting your files for transfer... 🛡️",
    "Verifying file integrity... ✅",
    "Beaming files to the cloud... ☁️",
    "Organizing your submission... 🗂️",
    "Compressing data for transfer... 📦",
    "Finalizing the secure upload... 🚀",
    "Almost there, just a moment..."
];

uploadInput.addEventListener('change', () => {
    previewDiv.innerHTML = '';
    Array.from(uploadInput.files).forEach(file => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        previewDiv.appendChild(img);
    });
});

uploadBtn.addEventListener('click', async () => {
    const files = Array.from(uploadInput.files);
    if (!files.length) return alert('Please select some photos first!');

    let uploadFailed = false;

    statusMsg.textContent = engagingMessages[0];
    progressContainer.style.display = 'block';
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    
    await new Promise(resolve => setTimeout(resolve, 50)); 

    progressBar.style.transition = 'width 8s ease-out';
    progressBar.style.width = '90%';
    
    uploadBtn.disabled = true;

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            await push(ref(db, 'uploads'), { fileName: file.name, url: data.secure_url });
        } catch (err) {
            console.error(`Upload failed for ${file.name}:`, err);
            uploadFailed = true;
        }
    };

    const uploadPromises = files.map(file => uploadFile(file));
    await Promise.all(uploadPromises);

    progressBar.style.transition = 'width 0.5s ease-in-out';
    progressBar.style.width = '100%';

    if (uploadFailed) {
        statusMsg.textContent = 'Phew! Most files are up, but a few had issues. Check the console for details.';
    } else {
        statusMsg.textContent = 'Upload complete! Your files have been securely received. ✅';
    }

    setTimeout(() => {
        progressContainer.style.display = 'none';
    }, 2000);
    
    uploadBtn.disabled = false;
    previewDiv.innerHTML = '';
    uploadInput.value = '';
});

const messagesRef = ref(db, 'messages');

function appendMessage(msg) {
    const div = document.createElement('div');
    div.className = 'message ' + (msg.sender === 'user' ? 'user' : 'admin');
    div.textContent = msg.text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

onValue(messagesRef, snapshot => {
    chatBox.innerHTML = '';
    const data = snapshot.val() || {};
    Object.values(data).forEach(msg => appendMessage(msg));
});

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    push(messagesRef, { sender: 'user', text, timestamp: Date.now() });
    chatInput.value = '';
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});
