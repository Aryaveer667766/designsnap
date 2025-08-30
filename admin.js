// admin.js
import { db, storage, dbRef, push, set, onValue, remove, update, sRef, getDownloadURL, deleteObject } from './firebase.js';

// Elements
const uploadsContainer = document.getElementById('uploadsContainer');
const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');

const userIdInput = document.getElementById('userIdInput');
const linkInput = document.getElementById('linkInput');
const sendLinkBtn = document.getElementById('sendLinkBtn');

const chatUserSelect = document.getElementById('chatUserSelect');
const chatMessagesDiv = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMsgBtn = document.getElementById('sendMsg');

const analyticsData = document.getElementById('analyticsData');

// --- 1. Load uploads day-wise ---
const uploadsRef = dbRef(db, 'uploads');
onValue(uploadsRef, snapshot => {
  const data = snapshot.val() || {};
  uploadsContainer.innerHTML = '';
  chatUserSelect.innerHTML = '<option value="">Select User</option>';

  let totalUploads = 0;

  Object.keys(data).forEach(userId => {
    const userUploads = data[userId];
    totalUploads += Object.keys(userUploads).length;

    // Add user to chat dropdown
    const opt = document.createElement('option');
    opt.value = userId;
    opt.textContent = userId;
    chatUserSelect.appendChild(opt);

    // Group by day
    const uploadsByDay = {};
    Object.values(userUploads).forEach(file => {
      const date = new Date(file.timestamp).toDateString();
      if (!uploadsByDay[date]) uploadsByDay[date] = [];
      uploadsByDay[date].push(file);
    });

    Object.keys(uploadsByDay).forEach(day => {
      const dayDiv = document.createElement('div');
      dayDiv.innerHTML = `<h3>${day} - ${userId}</h3>`;
      
      uploadsByDay[day].forEach(file => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'file-item';
        fileDiv.innerHTML = `
          <img src="${file.url}" width="100" style="margin:5px">
          <button class="deleteBtn">Delete</button>
        `;
        // Delete individual file
        fileDiv.querySelector('.deleteBtn').addEventListener('click', () => {
          const storageReference = sRef(storage, `uploads/${userId}/${file.fileName}`);
          deleteObject(storageReference).then(() => {
            remove(dbRef(db, `uploads/${userId}/${file.fileName}`));
          });
        });
        dayDiv.appendChild(fileDiv);
      });

      uploadsContainer.appendChild(dayDiv);
    });
  });

  analyticsData.textContent = `Total Uploads: ${totalUploads}`;
});

// --- 2. Bulk Delete ---
bulkDeleteBtn.addEventListener('click', () => {
  if (!confirm('Are you sure you want to delete ALL uploads?')) return;

  onValue(uploadsRef, snapshot => {
    const data = snapshot.val() || {};
    Object.keys(data).forEach(userId => {
      Object.values(data[userId]).forEach(file => {
        const storageReference = sRef(storage, `uploads/${userId}/${file.fileName}`);
        deleteObject(storageReference);
      });
    });
  }, {once:true});

  remove(uploadsRef);
});

// --- 3. Send Link to User ---
sendLinkBtn.addEventListener('click', () => {
  const uid = userIdInput.value.trim();
  const link = linkInput.value.trim();
  if (!uid || !link) return alert('Enter User ID and Link');

  set(dbRef(db, `links/${uid}`), link)
    .then(() => alert('Link sent!'))
    .catch(err => console.error(err));
  userIdInput.value = '';
  linkInput.value = '';
});

// --- 4. Chat System ---
let selectedChatUser = '';

chatUserSelect.addEventListener('change', () => {
  selectedChatUser = chatUserSelect.value;
  loadChat(selectedChatUser);
});

sendMsgBtn.addEventListener('click', () => {
  if (!selectedChatUser) return alert('Select a user to chat');
  const msg = chatInput.value.trim();
  if (!msg) return;

  push(dbRef(db, `chats/${selectedChatUser}`), {
    sender: 'admin',
    message: msg,
    timestamp: Date.now()
  });
  chatInput.value = '';
});

// Load chat messages
function loadChat(userId) {
  if (!userId) {
    chatMessagesDiv.innerHTML = '';
    return;
  }

  const chatRef = dbRef(db, `chats/${userId}`);
  onValue(chatRef, snapshot => {
    chatMessagesDiv.innerHTML = '';
    const messages = snapshot.val();
    if (!messages) return;
    Object.values(messages).forEach(msgObj => {
      const div = document.createElement('div');
      div.textContent = `${msgObj.sender === 'admin' ? 'Design Snap' : 'User'}: ${msgObj.message}`;
      div.className = msgObj.sender === 'admin' ? 'chat-admin' : 'chat-user';
      chatMessagesDiv.appendChild(div);
      chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    });
  });
}
