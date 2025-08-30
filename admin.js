import { db, ref, onValue, remove, set, push } from './firebase.js';

// --- HTML Element References ---
const uploadsContainer = document.getElementById('uploadsContainer');
const linkInput = document.getElementById('linkInput');
const sendLinkBtn = document.getElementById('sendLinkBtn');
const deleteLinkBtn = document.getElementById('deleteLinkBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn'); // New button reference

const adminChatBox = document.getElementById('adminChatBox');
const adminChatInput = document.getElementById('adminChatInput');
const adminChatSend = document.getElementById('adminChatSend');

// --- Firebase References ---
const uploadsRef = ref(db, 'uploads');
const messagesRef = ref(db, 'messages');

// --- Local State ---
let currentUploads = []; // Store the list of uploads for easy access

// --- Display all uploads ---
onValue(uploadsRef, snapshot => {
    const data = snapshot.val() || {};
    uploadsContainer.innerHTML = ''; // Clear previous view
    
    // Convert Firebase object to an array and store it
    currentUploads = Object.keys(data).map(key => ({
        key: key,
        fileName: data[key].fileName,
        url: data[key].url
    }));

    if (currentUploads.length === 0) {
        uploadsContainer.innerHTML = '<p>No uploads yet.</p>';
        return;
    }

    currentUploads.forEach(file => {
        const div = document.createElement('div');
        div.className = 'upload-item'; // Use a class for easier styling
        div.innerHTML = `
            <img src="${file.url}" alt="${file.fileName}" title="${file.fileName}">
            <button class="deleteBtn">Delete</button>
        `;
        div.querySelector('.deleteBtn').addEventListener('click', () => {
            if (confirm(`Delete ${file.fileName}?`)) {
                remove(ref(db, `uploads/${file.key}`));
            }
        });
        uploadsContainer.appendChild(div);
    });
});

// --- Download all uploads as a ZIP file ---
downloadAllBtn.addEventListener('click', async () => {
    if (currentUploads.length === 0) {
        alert('There are no images to download.');
        return;
    }

    // Give user feedback that the process has started
    const originalBtnText = downloadAllBtn.textContent;
    downloadAllBtn.textContent = 'Preparing Zip... ⏳';
    downloadAllBtn.disabled = true;

    const zip = new JSZip();

    try {
        const imagePromises = currentUploads.map(file => {
            // Fetch the image data from its URL
            return fetch(file.url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${file.fileName}`);
                    }
                    return response.blob(); // Get the image content as a Blob
                })
                .then(blob => {
                    // Add the image blob to the zip file
                    zip.file(file.fileName, blob);
                });
        });

        // Wait for all images to be fetched and added to the zip
        await Promise.all(imagePromises);

        // Generate the zip file asynchronously
        const zipContent = await zip.generateAsync({ type: 'blob' });

        // Create a temporary link to trigger the download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipContent);
        link.download = `designsnap_uploads_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href); // Clean up the object URL

    } catch (error) {
        console.error('Error creating ZIP file:', error);
        alert('Could not create the ZIP file. Please check the console for errors.');
    } finally {
        // Restore the button to its original state
        downloadAllBtn.textContent = originalBtnText;
        downloadAllBtn.disabled = false;
    }
});


// --- Other Button Listeners ---

deleteAllBtn.addEventListener('click', () => {
    if (!confirm('Are you sure you want to delete ALL uploads?')) return;
    remove(ref(db, 'uploads')).then(() => alert('All uploads deleted!')).catch(console.error);
});

sendLinkBtn.addEventListener('click', () => {
    const link = linkInput.value.trim();
    if (!link) return alert('Enter a link first!');
    set(ref(db, 'link'), link).then(() => alert('Link sent!')).catch(console.error);
    linkInput.value = '';
});

deleteLinkBtn.addEventListener('click', () => {
    remove(ref(db, 'link')).then(() => alert('Link deleted!')).catch(console.error);
});


// --- Chat Logic ---

function appendMessage(msg) {
    const div = document.createElement('div');
    div.className = 'message ' + (msg.sender === 'admin' ? 'admin' : 'user');
    div.textContent = msg.text;
    adminChatBox.appendChild(div);
    adminChatBox.scrollTop = adminChatBox.scrollHeight;
}

onValue(messagesRef, snapshot => {
    adminChatBox.innerHTML = '';
    const data = snapshot.val() || {};
    Object.values(data).forEach(msg => appendMessage(msg));
});

function sendMessage() {
    const text = adminChatInput.value.trim();
    if (!text) return;
    push(messagesRef, { sender: 'admin', text, timestamp: Date.now() });
    adminChatInput.value = '';
}

adminChatSend.addEventListener('click', sendMessage);
adminChatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
