// user.js
import { db, storage, dbRef, push, set, onValue, sRef, uploadBytesResumable, getDownloadURL } from './firebase.js';

// Generate a unique user ID (like USR#1234)
const userId = 'USR#' + Math.floor(Math.random() * 100000);

// Elements
const uploadInput = document.getElementById('photoUpload');
const uploadBtn = document.getElementById('uploadBtn');
const statusMsg = document.getElementById('statusMsg');
const previewDiv = document.getElementById('preview');
const userLinkDiv = document.getElementById('userLink');

const chatInput = document.getElementById('chatInput');
const sendMsgBtn = document.getElementById('sendMsg');
const chatMessagesDiv = document.getElementById('chatMessages');

// --- 1. Live Preview ---
uploadInput.addEventListener('change', () => {
  previewDiv.innerHTML = '';
  const files = Array.from(uploadInput.files);
  files.forEach(file => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.width = '100px';
    img.style.margin = '5px';
    previewDiv.appendChild(img);
  });
});

// --- 2. Upload Files ---
uploadBtn.addEventListener('click', () => {
  const files = Array.from(uploadInput.files);
  if (!files.length) {
    alert('Please select at least one file.');
    return;
  }

  statusMsg.textContent = 'Uploading... ⏳';

  files.forEach(file => {
    const storageRef = sRef(storage, `uploads/${userId}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      snapshot => {
        // Optional: could show progress here
      },
      error => {
        console.error(error);
        statusMsg.textContent = 'Upload failed!';
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(downloadURL => {
          // Save file info to Realtime DB
          const uploadRef = dbRef(db, `uploads/${userId}`);
          push(uploadRef, {
            fileName: file.name,
            url: downloadURL,
            timestamp: Date.now(),
            status: 'pending'
          });
        });
      }
    );
  });

  statusMsg.textContent = 'Uploaded successfully! You will get the link within a few hours. Please wait...';
  previewDiv.innerHTML = '';
  uploadInput.value = '';
});

// --- 3. Listen for Admin Link ---
const linkRef = dbRef(db, `links/${userId}`);
onValue(linkRef, snapshot => {
  const link = snapshot.val();
  if (link) {
    userLinkDiv.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
  }
});

// --- 4. Chat System ---
const chatRef = dbRef(db, `chats/${userId}`);
sendMsgBtn.addEventListener('click', () => {
  const msg = chatInput.value.trim();
  if (!msg) return;
  push(chatRef, {
    sender: 'user',
    message: msg,
    timestamp: Date.now()
  });
  chatInput.value = '';
});

// Listen for chat messages
onValue(chatRef, snapshot => {
  chatMessagesDiv.innerHTML = '';
  const messages = snapshot.val();
  if (!messages) return;
  Object.values(messages).forEach(msgObj => {
    const div = document.createElement('div');
    div.textContent = `${msgObj.sender === 'user' ? 'You' : 'Design Snap'}: ${msgObj.message}`;
    div.className = msgObj.sender === 'user' ? 'chat-user' : 'chat-admin';
    chatMessagesDiv.appendChild(div);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
  });
});
