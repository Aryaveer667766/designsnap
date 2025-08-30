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

// --- NEW: Get progress bar elements ---
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');


// A list of fun, engaging messages to show during upload
const engagingMessages = [
    "Unleashing the creative gnomes... 🧙‍♂️",
    "Polishing your pixels to perfection... ✨",
    "Teaching your photos how to smile... 😊",
    "Brewing a fresh pot of creativity... ☕",
    "Aligning the design chakras... 🧘",
    "Reticulating splines... (it's a classic for a reason!)",
    "Giving your images a digital pep talk... 📣",
    "Finding the perfect spot in the cloud... ☁️"
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

// Upload images to Cloudinary
uploadBtn.addEventListener('click', async () => {
    const files = Array.from(uploadInput.files);
    if (!files.length) return alert('Please select some photos first!');

    let uploadFailed = false;
    const totalFiles = files.length;
    let filesUploaded = 0;
    let messageIndex = 0;
    
    // --- NEW: Show and reset the progress bar ---
    statusMsg.textContent = ''; // Clear old messages
    progressBar.style.width = '0%';
    progressContainer.style.display = 'block';


    for (const file of files) {
        filesUploaded++;
        
        // Update the fun message, but without the text counter
        messageIndex = (messageIndex + 1) % engagingMessages.length;
        statusMsg.textContent = engagingMessages[messageIndex];

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            push(ref(db, 'uploads'), { fileName: file.name, url: data.secure_url });
        } catch (err) {
            console.error(`Upload failed for ${file.name}:`, err);
            uploadFailed = true;
        }

        // --- NEW: Update the progress bar width ---
        const progress = (filesUploaded / totalFiles) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    // --- Final Status Update ---
    if (uploadFailed) {
        statusMsg.textContent = 'Phew! Most photos are up, but a few were shy. Check the console for details.';
    } else {
        statusMsg.textContent = 'All done! Your photos are ready for their close-up. 📸';
    }
    
    // --- NEW: Hide the progress bar after a short delay ---
    setTimeout(() => {
        progressContainer.style.display = 'none';
    }, 2000); // Hide after 2 seconds

    previewDiv.innerHTML = '';
    uploadInput.value = '';
});

// Listen for admin link
onValue(ref(db, 'link'), snapshot => {
    const link = snapshot.val();
    if (link) userLinkDiv.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
    else userLinkDiv.textContent = '⏳ Waiting for Design Snap to send your link...';
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

// Listen for messages
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
