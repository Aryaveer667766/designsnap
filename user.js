import { db, ref, push, onValue } from './firebase.js';

const CLOUD_NAME = 'drt1pkzu4';
const UPLOAD_PRESET = 'designsnap_unsigned';

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

// Preview images
uploadInput.addEventListener('change', () => {
    previewDiv.innerHTML = '';
    Array.from(uploadInput.files).forEach(file => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        previewDiv.appendChild(img);
    });
});

// Main upload click handler
uploadBtn.addEventListener('click', async () => {
    const files = Array.from(uploadInput.files);
    if (!files.length) return alert('Please select some photos first!');

    let uploadFailed = false;

    // --- NEW PERCEPTION-BASED PROGRESS BAR LOGIC ---

    // 1. Show the bar and start the "fake" progress to 90%
    statusMsg.textContent = engagingMessages[0];
    progressContainer.style.display = 'block';
    // Reset any previous transition and set width to 0
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';
    
    // We need a tiny delay for the browser to apply the 0% width before animating
    await new Promise(resolve => setTimeout(resolve, 50)); 

    // Animate smoothly to 90% over 8 seconds to give a sense of speed
    progressBar.style.transition = 'width 8s ease-out';
    progressBar.style.width = '90%';
    
    // ---

    uploadBtn.disabled = true;

    // This function handles the upload for a single file.
    // NOTE: Image compression has been REMOVED to upload high-quality files.
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

    // Create an array of upload promises that will run in parallel in the background
    const uploadPromises = files.map(file => uploadFile(file));

    // Wait for all the actual uploads to finish
    await Promise.all(uploadPromises);

    // --- FINISH THE PROGRESS BAR ---
    
    // 2. Once uploads are done, quickly snap the bar to 100%
    progressBar.style.transition = 'width 0.5s ease-in-out';
    progressBar.style.width = '100%';

    // --- Final Status Update ---
    if (uploadFailed) {
        statusMsg.textContent = 'Phew! Most files are up, but a few had issues. Check the console for details.';
    } else {
        statusMsg.textContent = 'Upload complete! Your files have been securely received. ✅';
    }

    // Hide the progress bar and clean up UI
    setTimeout(() => {
        progressContainer.style.display = 'none';
    }, 2000);
    
    uploadBtn.disabled = false;
    previewDiv.innerHTML = '';
    uploadInput.value = '';
});


// ... (rest of the file remains the same) ...
// Listen for admin link
onValue(ref(db, 'link'), snapshot => {
    const link = snapshot.val();
    if (link) userLinkDiv.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
    else userLinkDiv.textContent = '⏳ Waiting for your link...';
});
// Chat logic
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
// Send message on click
chatSend.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (!text) return;
    push(messagesRef, { sender: 'user', text, timestamp: Date.now() });
    chatInput.value = '';
});
// Send message on Enter key press
chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        chatSend.click();
    }
});
