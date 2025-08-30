import { db, ref, onValue, remove, set, push } from './firebase.js';

const uploadsContainer = document.getElementById('uploadsContainer');
const linkInput = document.getElementById('linkInput');
const sendLinkBtn = document.getElementById('sendLinkBtn');
const deleteLinkBtn = document.getElementById('deleteLinkBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');

const adminChatBox = document.getElementById('adminChatBox');
const adminChatInput = document.getElementById('adminChatInput');
const adminChatSend = document.getElementById('adminChatSend');

const uploadsRef = ref(db, 'uploads');

// Display all uploads
onValue(uploadsRef, snapshot => {
    const data = snapshot.val() || {};
    uploadsContainer.innerHTML = '';
    Object.keys(data).forEach(key => {
        const file = data[key];
        const div = document.createElement('div');
        div.style.display = 'inline-block';
        div.style.textAlign = 'center';
        div.innerHTML = `
            <img src="${file.url}" alt="${file.fileName}">
            <br>
            <button class="deleteBtn">Delete</button>
        `;
        div.querySelector('.deleteBtn').addEventListener('click', () => {
            remove(ref(db, `uploads/${key}`));
        });
        uploadsContainer.appendChild(div);
    });
});

// Delete all uploads
deleteAllBtn.addEventListener('click', () => {
    if (!confirm('Are you sure you want to delete ALL uploads?')) return;
    remove(ref(db, 'uploads')).then(() => alert('All uploads deleted!')).catch(console.error);
});

// Send link
sendLinkBtn.addEventListener('click', () => {
    const link = linkInput.value.trim();
    if (!link) return alert('Enter a link first!');
    set(ref(db, 'link'), link).then(() => alert('Link sent!')).catch(console.error);
    linkInput.value = '';
});

// Delete link
deleteLinkBtn.addEventListener('click', () => {
    remove(ref(db, 'link')).then(() => alert('Link deleted!')).catch(console.error);
});

// Chat logic
const messagesRef = ref(db, 'messages');

function appendMessage(msg) {
    const div = document.createElement('div');
    div.className = 'message ' + (msg.sender === 'admin' ? 'admin' : 'user');
    div.textContent = msg.text;
    adminChatBox.appendChild(div);
    adminChatBox.scrollTop = adminChatBox.scrollHeight;
}

// Listen for messages
onValue(messagesRef, snapshot => {
    adminChatBox.innerHTML = '';
    const data = snapshot.val() || {};
    Object.values(data).forEach(msg => appendMessage(msg));
});

// Send message
adminChatSend.addEventListener('click', () => {
    const text = adminChatInput.value.trim();
    if (!text) return;
    push(messagesRef, { sender: 'admin', text, timestamp: Date.now() });
    adminChatInput.value = '';
});
