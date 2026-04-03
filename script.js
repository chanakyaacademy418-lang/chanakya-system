// 1. Firebase Configuration (Compat Mode)
const firebaseConfig = {
    apiKey: "AIzaSyBeB6h9G7YwMhDodIPpoZIHaNyDu6-IERs",
    authDomain: "chanakya-certificates.firebaseapp.com",
    projectId: "chanakya-certificates",
    storageBucket: "chanakya-certificates.appspot.com",
    messagingSenderId: "1020718754886",
    appId: "1:1020718754886:web:8e02b20b25e526b6cdae47"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// State
let allStudents = [];

// 2. Formatting Helpers
const toTitleCase = (str) => {
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatCertDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();

    const suffix = (d) => {
        if (d > 3 && d < 21) return 'th';
        switch (d % 10) {
            case 1: return "st";
            case 2: return "nd";
            case 3: return "rd";
            default: return "th";
        }
    };
    return `${day}${suffix(day)} ${month} ${year}`;
};

const generateCertID = (code) => {
    const year = new Date().getFullYear();
    return `CERT-${year}-${code.padStart(3, '0')}`;
};

// 3. Core Logic: Add Manual
async function addStudentManual() {
    const nameInput = document.getElementById('name').value;
    const codeNum = document.getElementById('code').value;
    const level = document.getElementById('level').value;
    const course = document.getElementById('course').value;
    const date = document.getElementById('date').value;

    if(!nameInput || !codeNum || !level || !date) return alert("Please fill all required fields");

    const studentData = {
        name: toTitleCase(nameInput),
        code: `CA${codeNum.padStart(3, '0')}`,
        level: level,
        course: course,
        date: date,
        certId: generateCertID(codeNum),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection("students").add(studentData);
        showPreview(studentData);
        loadHistory();
    } catch (e) {
        console.error("Error saving: ", e);
    }
}

// 4. Excel Logic
document.getElementById('excelFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(evt) {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        processExcelRows(rows);
    };
    reader.readAsBinaryString(file);
});

function processExcelRows(rows) {
    const previewList = document.getElementById('pendingList');
    previewList.innerHTML = '';
    
    window.pendingBatch = rows.map(row => ({
        name: toTitleCase(row.Name || ""),
        code: `CA${String(row.Code || 0).padStart(3, '0')}`,
        level: row.Level === 'level 0' ? 'Foundation Level' : toTitleCase(row.Level || ""),
        course: row.Course || "Abacus",
        date: row.Date || new Date().toISOString().split('T')[0],
        certId: generateCertID(String(row.Code || 0))
    }));

    document.getElementById('excelPreview').style.display = 'block';
    document.getElementById('batchCount').innerText = window.pendingBatch.length;

    window.pendingBatch.forEach(s => {
        const div = document.createElement('div');
        div.className = 'student-item-mini';
        div.innerHTML = `<b>${s.name}</b> - ${s.code}`;
        previewList.appendChild(div);
    });
}

async function saveBatch() {
    const btn = document.querySelector('.btn-success');
    btn.innerText = "Saving...";
    const batch = db.batch();
    
    window.pendingBatch.forEach(data => {
        const ref = db.collection("students").doc();
        batch.set(ref, { ...data, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
    });

    await batch.commit();
    alert("Batch Uploaded!");
    document.getElementById('excelPreview').style.display = 'none';
    loadHistory();
}

// 5. History & Search
async function loadHistory() {
    const snapshot = await db.collection("students").orderBy("timestamp", "desc").get();
    allStudents = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    renderTable(allStudents);
}

function renderTable(data) {
    const tbody = document.getElementById('historyTable');
    tbody.innerHTML = data.map(s => `
        <tr>
            <td>${s.code}</td>
            <td>${s.name}</td>
            <td>${s.level}</td>
            <td>${s.date}</td>
            <td><button onclick="viewFromHistory('${s.id}')">View</button></td>
        </tr>
    `).join('');
}

function handleSearch() {
    const term = document.getElementById('searchBox').value.toLowerCase();
    const filtered = allStudents.filter(s => 
        s.name.toLowerCase().includes(term) || 
        s.code.toLowerCase().includes(term) ||
        s.date.includes(term)
    );
    renderTable(filtered);
}

// 6. Preview & Download
function showPreview(data) {
    document.getElementById('display-name').innerText = data.name;
    document.getElementById('display-level').innerText = `${data.level} in ${data.course}`;
    document.getElementById('display-date').innerText = formatCertDate(data.date);
    document.getElementById('display-cert-id').innerText = data.certId;
    document.getElementById('display-student-id').innerText = data.code;
    
    document.getElementById('certModal').style.display = 'block';
}

function viewFromHistory(id) {
    const student = allStudents.find(s => s.id === id);
    showPreview(student);
}

function closeModal() { document.getElementById('certModal').style.display = 'none'; }

async function downloadOutput(type) {
    const element = document.getElementById('certificate');
    const canvas = await html2canvas(element, { scale: 3, useCORS: true });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const fileName = `${document.getElementById('display-name').innerText}_Certificate`;

    if(type === 'jpg') {
        const link = document.createElement('a');
        link.download = `${fileName}.jpg`;
        link.href = imgData;
        link.click();
    } else {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('l', 'mm', 'a4');
        pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
        pdf.save(`${fileName}.pdf`);
    }
}

// Init
window.onload = () => {
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    loadHistory();
};
