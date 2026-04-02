// 1. Firebase Configuration (Keep your existing config)
const firebaseConfig = {
    apiKey: "AIzaSyBeB6h9G7YwMhDodIPpoZIHaNyDu6-IERs",
    authDomain: "chanakya-certificates.firebaseapp.com",
    projectId: "chanakya-certificates",
    storageBucket: "chanakya-certificates.firebasestorage.app",
    messagingSenderId: "1020718754886",
    appId: "1:1020718754886:web:8e02b20b25e526b6cdae47"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let students = []; // Master list

const listDiv = document.getElementById("list");
const certContainer = document.getElementById("cert-container");

// Load Data
async function loadData() {
    try {
        const snap = await db.collection("students").orderBy("createdAt", "desc").get();
        students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        render(students);
    } catch (error) {
        console.error("Firebase Error:", error);
    }
}

// Render List (Fixed to use ID)
function render(data) {
    if (data.length === 0) {
        listDiv.innerHTML = '<p style="text-align:center; padding:10px;">No records found.</p>';
        return;
    }
    listDiv.innerHTML = data.map(s => `
        <div class="student-item" onclick="preview('${s.id}')">
            <strong>${s.name}</strong><br>
            <small>${s.code} | ${s.course}</small>
        </div>
    `).join("");
}

// Add Student
async function addStudent() {
    const data = {
        name: document.getElementById("name").value.trim(),
        level: document.getElementById("level").value.trim(),
        date: document.getElementById("date").value.trim(),
        code: document.getElementById("code").value.trim(),
        marks: document.getElementById("marks").value.trim(),
        course: document.getElementById("course").value,
        createdAt: Date.now()
    };

    if (!data.name || !data.code) return alert("Fill Name and Student ID!");

    try {
        await db.collection("students").add(data);
        alert("Saved!");
        loadData();
    } catch (e) { alert("Error saving data."); }
}

// Preview (Fixed: Always finds the right student by ID)
function preview(id) {
    const s = students.find(item => item.id === id);
    if (!s) return;

    document.getElementById("cname").innerText = s.name;
    document.getElementById("clevel_display").innerText = `${s.level} in ${s.course}`;
    document.getElementById("cdate").innerText = s.date;
    document.getElementById("ccode").innerText = s.code;
    document.getElementById("ccertid").innerText = `CERT-${new Date().getFullYear()}-${s.code}`;

    certContainer.style.display = "block";
    certContainer.scrollIntoView({ behavior: 'smooth' });
}

// Search
function searchData() {
    const term = document.getElementById("searchBox").value.toLowerCase();
    const filtered = students.filter(s => 
        s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term)
    );
    render(filtered);
}

// Download PDF
async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const canvas = await html2canvas(document.getElementById("certificate"), { scale: 3 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    
    pdf.addImage(imgData, "PNG", 0, 0, 297, 210); // A4 Landscape size
    pdf.save(`${document.getElementById("cname").innerText}_Certificate.pdf`);
}

window.onload = loadData;
