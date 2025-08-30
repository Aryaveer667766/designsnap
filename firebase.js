// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAZ_c3EaDxSZ6RrNrwQjR_TauJHrPfk_lk",
  authDomain: "designsnap-f3309.firebaseapp.com",
  databaseURL: "https://designsnap-f3309-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "designsnap-f3309",
  storageBucket: "designsnap-f3309.appspot.com",
  messagingSenderId: "741888249963",
  appId: "1:741888249963:web:9540c9f68d6f0d5da9a12e",
  measurementId: "G-YC8TDQF1MM"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, push, set, onValue, remove };
