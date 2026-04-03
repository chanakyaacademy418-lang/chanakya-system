// 1. Firebase Config
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
let students = [];

// 2. Load Data
async function loadData() {
    try {
        const snap = await db.collection("students").get();
        students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        render(students);
    } catch (e) { console.error(e); }
}

function render(data) {
    const list = document.getElementById("list");
    if (data.length === 0) { list.innerHTML = "<p style='padding:10px;'>No records.</p>"; return; }
    list.innerHTML = data.sort((a,b) => a.name.localeCompare(b.name)).map(s => `
        <div class="student-item" onclick="preview('${s.id}')">
            <strong>${s.name}</strong><br><small>${s.code} | ${s.level}</small>
        </div>
    `).join("");
}

// 3. Add Student
async function addStudent() {
    const data = {
        name: document.getElementById("name").value.trim(),
        level: document.getElementById("level").value,
        date: document.getElementById("date").value,
        code: document.getElementById("code").value.trim(),
        course: document.getElementById("course").value,
        createdAt: Date.now()
    };

    if (!data.name || !data.level || !data.date || !data.code) return alert("Fill all fields!");

    try {
        await db.collection("students").add(data);
        alert("Saved!");
        document.getElementById("name").value = "";
        document.getElementById("code").value = "";
        loadData();
    } catch (e) { alert("Error saving."); }
}

// 4. Preview & Format Date
function preview(id) {
    const s = students.find(x => x.id === id);
    if (!s) return;

    const d = new Date(s.date);
    const formattedDate = d.toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });

    document.getElementById("cname").innerText = s.name.toUpperCase();
    document.getElementById("clevel_display").innerText = `${s.level} in ${s.course}`;
    document.getElementById("cdate").innerText = formattedDate;
    document.getElementById("ccode").innerText = s.code;
    document.getElementById("ccertid").innerText = `CERT-2026-${s.code.split('-').pop()}`;

    document.getElementById("cert-container").style.display = "block";
    document.getElementById("cert-container").scrollIntoView({ behavior: 'smooth' });
}

// 5. Search
function searchData() {
    const term = document.getElementById("searchBox").value.toLowerCase();
    render(students.filter(s => s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term)));
}

// 6. PDF Download
async function downloadPDF() {
    const btn = document.querySelector(".btn-download");
    btn.innerText = "Generating...";
    const canvas = await html2canvas(document.getElementById("certificate"), { scale: 3 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jspdf.jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
    pdf.save(`${document.getElementById("cname").innerText}.pdf`);
    btn.innerText = "📥 Download for Printing";
}

// 7. Initialize with Today's Date
window.onload = () => {
    document.getElementById("date").value = new Date().toISOString().split('T')[0];
    loadData();
};
