import { firebaseConfig } from './firebase-config.js';

// Firebase v9+ modular SDK desde CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById('data-form');
const rowsBody = document.getElementById('rows');
const statusEl = document.getElementById('status');
const refreshBtn = document.getElementById('refresh');

function setStatus(text, kind = 'info') {
	statusEl.textContent = text || '';
	statusEl.className = `ms-3 small text-${kind}`;
}

function rowHtml(docData) {
	const name = docData.name ?? '';
	const email = docData.email ?? '';
	const message = docData.message ?? '';
	const createdAt = docData.createdAt?.toDate?.() || null;
	const dateText = createdAt ? createdAt.toLocaleString() : '';
	return `<tr>
		<td>${escapeHtml(name)}</td>
		<td>${escapeHtml(email)}</td>
		<td>${escapeHtml(message)}</td>
		<td>${escapeHtml(dateText)}</td>
	</tr>`;
}

function escapeHtml(str) {
	return String(str)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

async function loadLatest() {
	rowsBody.innerHTML = `<tr><td colspan="4" class="text-center p-4">Cargando...</td></tr>`;
	try {
		const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'), limit(20));
		const snap = await getDocs(q);
		if (snap.empty) {
			rowsBody.innerHTML = `<tr><td colspan="4" class="text-center p-4">Sin registros aún</td></tr>`;
			return;
		}
		const html = [];
		snap.forEach(doc => html.push(rowHtml(doc.data())));
		rowsBody.innerHTML = html.join('');
	} catch (err) {
		console.error(err);
		rowsBody.innerHTML = `<tr><td colspan="4" class="text-danger p-4">Error al cargar: ${escapeHtml(err.message || String(err))}</td></tr>`;
	}
}

form.addEventListener('submit', async (e) => {
	e.preventDefault();
	setStatus('Guardando...', 'secondary');
	const formData = new FormData(form);
	const name = formData.get('name')?.toString().trim();
	const email = formData.get('email')?.toString().trim();
	const message = formData.get('message')?.toString().trim();
	if (!name || !email) {
		setStatus('Nombre y correo son obligatorios', 'danger');
		return;
	}
	try {
		await addDoc(collection(db, 'submissions'), {
			name,
			email,
			message: message || null,
			createdAt: serverTimestamp(),
		});
		form.reset();
		setStatus('Guardado correctamente', 'success');
		await loadLatest();
	} catch (err) {
		console.error(err);
		setStatus(`Error al guardar: ${err.message || String(err)}`, 'danger');
	}
});

refreshBtn.addEventListener('click', (e) => {
	e.preventDefault();
	loadLatest();
});

// Primer render
loadLatest();