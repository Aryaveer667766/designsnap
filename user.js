// user.js
import { db, storage, dbRef, sRef, push, onValue, uploadBytesResumable, getDownloadURL } from './firebase.js';

const uploadInput = document.getElementById('photoUpload');
const uploadBtn = document.getElementById('uploadBtn');
const statusMsg = document.getElementById('statusMsg');
const previewDiv = document.getElementById('preview');
const userLinkDiv = document.getElementById('userLink');

// Preview selected images
uploadInput.addEventListener('change', () => {
  previewDiv.innerHTML = '';
  Array.from(uploadInput.files).forEach(file => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    previewDiv.appendChild(img);
  });
});

// Upload images
uploadBtn.addEventListener('click', () => {
  const files = Array.from(uploadInput.files);
  if (!files.length) return alert('Select files first');

  statusMsg.textContent = 'Uploading... ⏳';

  files.forEach(file => {
    const fileRef = sRef(storage, `uploads/${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      'state_changed',
      null,
      err => console.error(err),
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(url => {
          push(dbRef(db, 'uploads'), { fileName: file.name, url });
        });
      }
    );
  });

  statusMsg.textContent = 'Uploaded successfully! Wait for the link.';
  previewDiv.innerHTML = '';
  uploadInput.value = '';
});

// Listen for admin link and display
onValue(dbRef(db, 'link'), snapshot => {
  const link = snapshot.val();
  if (link) userLinkDiv.innerHTML = `<a href="${link}" target="_blank">${link}</a>`;
  else userLinkDiv.textContent = '⏳ Waiting for Design Snap to send your link...';
});
