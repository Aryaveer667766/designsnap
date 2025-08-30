// admin.js
import { db, storage, dbRef, onValue, remove, set, storageRef, deleteObject } from './firebase.js';

const uploadsContainer = document.getElementById('uploadsContainer');
const linkInput = document.getElementById('linkInput');
const sendLinkBtn = document.getElementById('sendLinkBtn');
const deleteLinkBtn = document.getElementById('deleteLinkBtn');

// Load and display all uploads
onValue(dbRef(db, 'uploads'), snapshot => {
  const data = snapshot.val() || {};
  uploadsContainer.innerHTML = '';

  Object.keys(data).forEach(key => {
    const file = data[key];
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `
      <img src="${file.url}" alt="${file.fileName}">
      <a href="${file.url}" download>Download</a>
      <button class="deleteBtn danger-btn">Delete</button>
    `;

    // Delete file
    div.querySelector('.deleteBtn').addEventListener('click', () => {
      deleteObject(storageRef(storage, `uploads/${file.fileName}`))
        .then(() => remove(dbRef(db, `uploads/${key}`)))
        .catch(err => console.error(err));
    });

    uploadsContainer.appendChild(div);
  });
});

// Send link to users
sendLinkBtn.addEventListener('click', () => {
  const link = linkInput.value.trim();
  if (!link) return alert('Enter a link first!');
  set(dbRef(db, 'link'), link)
    .then(() => alert('Link sent to users!'))
    .catch(err => console.error(err));
  linkInput.value = '';
});

// Delete link
deleteLinkBtn.addEventListener('click', () => {
  remove(dbRef(db, 'link'))
    .then(() => alert('Link deleted!'))
    .catch(err => console.error(err));
});
