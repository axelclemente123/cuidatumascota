// Base de datos local en LocalStorage
let usuarios = JSON.parse(localStorage.getItem('usuarios_db')) || [];
let usuarioActual = JSON.parse(localStorage.getItem('usuario_activo')) || null;
let mascotas = JSON.parse(localStorage.getItem('mascotas_db')) || [];
let tempFotoData = "";
let tempFotoEditData = "";
let mascotaSeleccionadaModal = null;

// Inicialización de la app
document.addEventListener('DOMContentLoaded', () => {
    if (usuarioActual) {
        mostrarDashboard();
    } else {
        document.getElementById('authOverlay').classList.remove('oculto');
    }
});

// Sistema de Notificaciones Toast Flotantes
function mostrarNotificacion(mensaje, tipo = 'exito') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    const icono = tipo === 'exito' ? 'ph-check-circle' : 'ph-warning-circle';
    toast.innerHTML = `
        <i class="ph ${icono}"></i>
        <span>${mensaje}</span>
    `;

    container.appendChild(toast);

    // Eliminar el toast del DOM después de que termine la animación (3 segundos)
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Cambiar entre Pestañas de Auth (Login / Registro)
function cambiarTabAuth(tab) {
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    const authAlert = document.getElementById('authAlert');

    authAlert.classList.add('oculto');

    if (tab === 'login') {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        formLogin.classList.remove('oculto');
        formRegister.classList.add('oculto');
    } else {
        tabRegisterBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        formRegister.classList.remove('oculto');
        formLogin.classList.add('oculto');
    }
}

// Registro de Usuario
function registrarUsuario(e) {
    e.preventDefault();
    const nombre = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value;
    const alert = document.getElementById('authAlert');

    const existe = usuarios.find(u => u.email === email);
    if (existe) {
        mostrarAlerta(alert, "❌ El correo ya se encuentra registrado.", "error");
        return;
    }

    const nuevoUsuario = { id: Date.now(), nombre, email, pass };
    usuarios.push(nuevoUsuario);
    localStorage.setItem('usuarios_db', JSON.stringify(usuarios));

    usuarioActual = nuevoUsuario;
    localStorage.setItem('usuario_activo', JSON.stringify(usuarioActual));

    mostrarNotificacion(`¡Bienvenido/a a CuidaTuMascota, ${nombre}!`, "exito");
    mostrarDashboard();
}

// Inicio de Sesión
function iniciarSesion(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    const alert = document.getElementById('authAlert');

    const usuario = usuarios.find(u => u.email === email && u.pass === pass);

    if (!usuario) {
        mostrarAlerta(alert, "❌ Correo o contraseña incorrectos.", "error");
        return;
    }

    usuarioActual = usuario;
    localStorage.setItem('usuario_activo', JSON.stringify(usuarioActual));
    mostrarNotificacion(`¡Sesión iniciada con éxito!`, "exito");
    mostrarDashboard();
}

// Cerrar Sesión
function cerrarSesion() {
    localStorage.removeItem('usuario_activo');
    usuarioActual = null;
    document.getElementById('appContent').classList.add('oculto');
    document.getElementById('authOverlay').classList.remove('oculto');
    mostrarNotificacion("Sesión cerrada correctamente.", "exito");
}

// Mostrar Dashboard Principal
function mostrarDashboard() {
    document.getElementById('authOverlay').classList.add('oculto');
    document.getElementById('appContent').classList.remove('oculto');

    document.getElementById('userNameDisplay').textContent = usuarioActual.nombre;
    document.getElementById('userEmailDisplay').textContent = usuarioActual.email;
    document.getElementById('welcomeUser').textContent = usuarioActual.nombre;

    actualizarListaMascotas();
    cargarSelectorMascotasIA();
}

// Navegación de secciones en el Dashboard
function mostrarSeccion(idSeccion) {
    const modulos = document.querySelectorAll('.modulo');
    const botones = document.querySelectorAll('.nav-btn');

    modulos.forEach(m => m.classList.remove('active'));
    botones.forEach(b => b.classList.remove('active'));

    document.getElementById(idSeccion).classList.add('active');

    const btnActivo = Array.from(botones).find(b => b.getAttribute('onclick').includes(idSeccion));
    if (btnActivo) btnActivo.classList.add('active');
}

// MANEJO DE FOTO DE LA MASCOTA (REGISTRO)
function previewImagenLocal(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (evt) {
            tempFotoData = evt.target.result;
            mostrarPreview(tempFotoData);
        };
        reader.readAsDataURL(file);
    }
}

function previewImagenUrl(url) {
    if (url.trim() !== '') {
        tempFotoData = url.trim();
        mostrarPreview(tempFotoData);
    }
}

function mostrarPreview(src) {
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('imagePreview');
    previewImg.src = src;
    previewContainer.classList.remove('oculto');
}

function quitarFoto() {
    tempFotoData = "";
    document.getElementById('fotoFile').value = "";
    document.getElementById('fotoUrl').value = "";
    document.getElementById('imagePreviewContainer').classList.add('oculto');
}

// GUARDAR NUEVA MASCOTA CON AÑOS, MESES, KILOS Y GRAMOS
function guardarMascota(e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const especie = document.getElementById('especie').value;
    
    // Capturar Años y Meses
    const edadAnios = document.getElementById('edadAnios').value || "0";
    const edadMeses = document.getElementById('edadMeses').value || "0";
    
    const raza = document.getElementById('raza').value.trim();
    
    // Capturar Kilos y Gramos
    const pesoKg = document.getElementById('pesoKg').value || "0";
    const pesoGramos = document.getElementById('pesoGramos').value || "0";
    
    const alert = document.getElementById('registroAlert');

    const fotoFinal = tempFotoData || obtenerImagenPorDefecto(especie);

    const nuevaMascota = {
        id: Date.now(),
        userId: usuarioActual.id,
        nombre,
        especie,
        edadAnios: Number(edadAnios),
        edadMeses: Number(edadMeses),
        raza,
        pesoKg: Number(pesoKg),
        pesoGramos: Number(pesoGramos),
        foto: fotoFinal,
        vacunas: []
    };

    mascotas.push(nuevaMascota);
    localStorage.setItem('mascotas_db', JSON.stringify(mascotas));

    mostrarNotificacion(`¡Mascota ${nombre} registrada con éxito!`, "exito");
    document.getElementById('formMascota').reset();
    quitarFoto();
    actualizarListaMascotas();
    cargarSelectorMascotasIA();
}

function obtenerImagenPorDefecto(especie) {
    switch (especie) {
        case 'Perro': return 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400';
        case 'Gato': return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400';
        case 'Ave': return 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400';
        case 'Conejo': return 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400';
        default: return 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400';
    }
}

// ACTUALIZAR Y CONSULTAR MASCOTAS REGISTRADAS
function actualizarListaMascotas() {
    const contenedor = document.getElementById('listaMascotas');
    const countMascotas = document.getElementById('countMascotas');
    contenedor.innerHTML = '';

    const misMascotas = mascotas.filter(m => m.userId === usuarioActual.id);
    countMascotas.textContent = misMascotas.length;

    if (misMascotas.length === 0) {
        contenedor.innerHTML = '<p class="text-muted">Aún no registraste ninguna mascota en tu cuenta.</p>';
        return;
    }

    misMascotas.forEach(m => {
        // Formatear Edad (Años y Meses)
        let textoEdad = `${m.edadAnios || 0} año(s)`;
        if (m.edadMeses > 0) {
            textoEdad += ` y ${m.edadMeses} mes(es)`;
        }

        // Formatear Peso (Kg y Gramos)
        let textoPeso = `${m.pesoKg || 0} kg`;
        if (m.pesoGramos > 0) {
            textoPeso += ` ${m.pesoGramos} g`;
        }
        if ((!m.pesoKg || m.pesoKg == 0) && (!m.pesoGramos || m.pesoGramos == 0)) {
            textoPeso = "No especificado";
        }

        const card = document.createElement('div');
        card.className = 'pet-card';
        card.innerHTML = `
            <img src="${m.foto}" alt="${m.nombre}" class="pet-img">
            <div class="pet-info">
                <h3>${m.nombre}</h3>
                <div class="pet-details">
                    <p><strong>Especie:</strong> ${m.especie}</p>
                    <p><strong>Edad:</strong> ${textoEdad}</p>
                    <p><strong>Raza:</strong> ${m.raza}</p>
                    <p><strong>Peso:</strong> ${textoPeso}</p>
                    <p><strong>Vacunas registradas:</strong> ${m.vacunas ? m.vacunas.length : 0}</p>
                </div>
            </div>
            <div class="pet-actions">
                <button class="btn-secondary" onclick="abrirModalEditar(${m.id})" title="Modificar datos"><i class="ph ph-note-pencil"></i> Editar</button>
                <button class="btn-secondary" onclick="abrirModalVacunas(${m.id})"><i class="ph ph-syringe"></i> Vacunas</button>
                <button class="btn-secondary" onclick="irAConsultarIA(${m.id})"><i class="ph ph-robot"></i> Asistente IA</button>
            </div>
        `;
        contenedor.appendChild(card);
    });
}

// MODIFICAR / EDITAR DATOS DE LA MASCOTA
function abrirModalEditar(petId) {
    const mascota = mascotas.find(m => m.id === petId);
    if (!mascota) return;

    document.getElementById('editMascotaId').value = mascota.id;
    document.getElementById('editNombre').value = mascota.nombre;
    document.getElementById('editEspecie').value = mascota.especie;
    document.getElementById('editEdadAnios').value = mascota.edadAnios !== undefined ? mascota.edadAnios : (mascota.edad || 0);
    document.getElementById('editEdadMeses').value = mascota.edadMeses !== undefined ? mascota.edadMeses : 0;
    document.getElementById('editRaza').value = mascota.raza;
    document.getElementById('editPesoKg').value = mascota.pesoKg !== undefined ? mascota.pesoKg : "";
    document.getElementById('editPesoGramos').value = mascota.pesoGramos !== undefined ? mascota.pesoGramos : "";
    document.getElementById('editFotoUrl').value = "";
    
    tempFotoEditData = mascota.foto;
    document.getElementById('editImagePreview').src = mascota.foto;

    document.getElementById('modalEditar').classList.remove('oculto');
}

function cerrarModalEditar() {
    document.getElementById('modalEditar').classList.add('oculto');
}

function previewImagenLocalEdit(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (evt) {
            tempFotoEditData = evt.target.result;
            document.getElementById('editImagePreview').src = tempFotoEditData;
        };
        reader.readAsDataURL(file);
    }
}

function previewImagenUrlEdit(url) {
    if (url.trim() !== '') {
        tempFotoEditData = url.trim();
        document.getElementById('editImagePreview').src = tempFotoEditData;
    }
}

function guardarEdicionMascota(e) {
    e.preventDefault();
    const id = Number(document.getElementById('editMascotaId').value);
    const mascotaIndex = mascotas.findIndex(m => m.id === id);

    if (mascotaIndex !== -1) {
        mascotas[mascotaIndex].nombre = document.getElementById('editNombre').value.trim();
        mascotas[mascotaIndex].especie = document.getElementById('editEspecie').value;
        mascotas[mascotaIndex].edadAnios = Number(document.getElementById('editEdadAnios').value) || 0;
        mascotas[mascotaIndex].edadMeses = Number(document.getElementById('editEdadMeses').value) || 0;
        mascotas[mascotaIndex].raza = document.getElementById('editRaza').value.trim();
        mascotas[mascotaIndex].pesoKg = Number(document.getElementById('editPesoKg').value) || 0;
        mascotas[mascotaIndex].pesoGramos = Number(document.getElementById('editPesoGramos').value) || 0;
        mascotas[mascotaIndex].foto = tempFotoEditData;

        localStorage.setItem('mascotas_db', JSON.stringify(mascotas));

        mostrarNotificacion("¡Ficha de paciente actualizada con éxito!", "exito");
        actualizarListaMascotas();
        cargarSelectorMascotasIA();
        cerrarModalEditar();
    }
}

// MODAL DE VACUNAS
function abrirModalVacunas(petId) {
    mascotaSeleccionadaModal = mascotas.find(m => m.id === petId);
    if (!mascotaSeleccionadaModal) return;

    document.getElementById('modalMascotaNombre').textContent = mascotaSeleccionadaModal.nombre;
    actualizarListaVacunasModal();
    document.getElementById('modalVacunas').classList.remove('oculto');
}

function cerrarModalVacunas() {
    document.getElementById('modalVacunas').classList.add('oculto');
    mascotaSeleccionadaModal = null;
}

function registrarVacuna(e) {
    e.preventDefault();
    const nombreVacuna = document.getElementById('vacunaNombre').value.trim();
    const fechaVacuna = document.getElementById('vacunaFecha').value;

    if (!mascotaSeleccionadaModal.vacunas) {
        mascotaSeleccionadaModal.vacunas = [];
    }

    mascotaSeleccionadaModal.vacunas.push({ nombre: nombreVacuna, fecha: fechaVacuna });
    localStorage.setItem('mascotas_db', JSON.stringify(mascotas));

    mostrarNotificacion(`Vacuna "${nombreVacuna}" registrada correctamente.`, "exito");
    document.getElementById('formVacuna').reset();
    actualizarListaVacunasModal();
    actualizarListaMascotas();
}

function actualizarListaVacunasModal() {
    const ul = document.getElementById('listaVacunasMascota');
    ul.innerHTML = '';

    const vacunas = mascotaSeleccionadaModal.vacunas || [];
    if (vacunas.length === 0) {
        ul.innerHTML = '<li class="text-muted">No hay vacunas registradas aún.</li>';
        return;
    }

    vacunas.forEach(v => {
        const li = document.createElement('li');
        li.innerHTML = `<span><strong>${v.nombre}</strong></span> <span>${v.fecha}</span>`;
        ul.appendChild(li);
    });
}

// =========================================================
// MOTOR IA VETERINARIO ULTRA PROFESIONAL Y ESTRUCTURADO
// =========================================================
function cargarSelectorMascotasIA() {
    const select = document.getElementById('selectMascotaIA');
    select.innerHTML = '<option value="general">-- Consulta General (Modo Estándar) --</option>';

    const misMascotas = mascotas.filter(m => m.userId === usuarioActual.id);
    misMascotas.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = `🐾 ${m.nombre} (${m.especie} - ${m.raza})`;
        select.appendChild(option);
    });
}

function irAConsultarIA(petId) {
    mostrarSeccion('ia-chat');
    document.getElementById('selectMascotaIA').value = petId;
    cambiarMascotaConsultaIA();
}

function cambiarMascotaConsultaIA() {
    const petId = document.getElementById('selectMascotaIA').value;
    if (petId === "general") {
        agregarMensajeBot("Cambiando a modo <strong>Consulta General</strong>. Por favor, selecciona a tu mascota arriba si deseas respuestas analizando su ficha médica.");
    } else {
        const mascota = mascotas.find(m => m.id == petId);
        if (mascota) {
            let edadStr = `${mascota.edadAnios || 0} años`;
            if (mascota.edadMeses > 0) edadStr += ` y ${mascota.edadMeses} meses`;
            
            let pesoStr = `${mascota.pesoKg || 0} kg`;
            if (mascota.pesoGramos > 0) pesoStr += ` ${mascota.pesoGramos} g`;

            agregarMensajeBot(`Ficha biológica vinculada: <strong>${mascota.nombre}</strong> (${mascota.especie}, ${edadStr}, Raza ${mascota.raza}, ${pesoStr}). ¡Motor listo para responder consultas contextuales!`);
        }
    }
}

function lanzarPreguntaRapida(pregunta) {
    document.getElementById('chatInput').value = pregunta;
    enviarPreguntaIA(new Event('submit'));
}

function enviarPreguntaIA(e) {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const mensaje = input.value.trim();
    if (!mensaje) return;

    agregarMensajeUsuario(mensaje);
    input.value = '';

    const typingIndicator = document.getElementById('typingIndicator');
    typingIndicator.classList.remove('oculto');
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const petId = document.getElementById('selectMascotaIA').value;
    const mascota = petId !== "general" ? mascotas.find(m => m.id == petId) : null;

    setTimeout(() => {
        typingIndicator.classList.add('oculto');
        const respuesta = evaluarConsultaIAPro(mensaje, mascota);
        agregarMensajeBot(respuesta);
    }, 700);
}

function agregarMensajeUsuario(texto) {
    const chatMessages = document.getElementById('chatMessages');
    const row = document.createElement('div');
    row.className = 'message-row user-row';
    row.innerHTML = `<div class="chat-bubble user-bubble">${texto}</div>`;
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function agregarMensajeBot(htmlContent) {
    const chatMessages = document.getElementById('chatMessages');
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const row = document.createElement('div');
    row.className = 'message-row bot-row';
    row.innerHTML = `
        <div class="ai-avatar-badge"><i class="ph ph-robot"></i></div>
        <div class="chat-bubble bot-bubble">
            <div class="ai-response-header">
                <span class="ai-name">Asistente CuidaTuMascota</span>
                <span class="ai-time">${horaActual}</span>
            </div>
            ${htmlContent}
        </div>
    `;
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// EVALUACIÓN AVANZADA Y ESTRUCTURADA DE LA IA
function evaluarConsultaIAPro(pregunta, mascota) {
    const msg = pregunta.toLowerCase();

    // 1. Detección de Síntomas / Urgencias de Salud
    if (msg.includes('vómita') || msg.includes('vomito') || msg.includes('sangre') || msg.includes('decaido') || msg.includes('remedio') || msg.includes('medicamento') || msg.includes('fiebre') || msg.includes('síntoma')) {
        return `
            <div class="ai-warning-box">
                <strong><i class="ph ph-warning-octagon"></i> Protocolo de Seguridad Médica Veterinaria:</strong><br>
                He detectado consultas sobre síntomas o medicación. Como asistente inteligente de prevención, **no prescribo medicamentos ni realizo diagnósticos clínicos definitivos**.<br><br>
                <em>Recomendación:</em> Si ${mascota ? mascota.nombre : 'tu mascota'} presenta cambios drásticos de conducta, falta de apetito o fiebre, acudí inmediatamente a un centro veterinario de urgencia.
            </div>
        `;
    }

    // Si NO hay mascota seleccionada
    if (!mascota) {
        if (msg.includes('vacuna') || msg.includes('alimento') || msg.includes('dieta') || msg.includes('ejercicio')) {
            return `Para ofrecerte un análisis clínico personalizado sobre vacunas o nutrición, seleccioná una de tus mascotas registradas en el selector de <strong>Contexto Biológico Activo</strong> superior.`;
        }
        return `Consulta recibida: <em>"${pregunta}"</em>.<br>Te sugiero seleccionar a tu mascota en el desplegable superior para evaluar sus datos biológicos y ficha técnica.`;
    }

    let edadStr = `${mascota.edadAnios || 0} años`;
    if (mascota.edadMeses > 0) edadStr += ` y ${mascota.edadMeses} meses`;

    // 2. Análisis Contextual de Vacunas (Con visualización Pro)
    if (msg.includes('vacuna') || msg.includes('vacunas') || msg.includes('inyeccion') || msg.includes('inmunizac')) {
        const vacunas = mascota.vacunas || [];
        let html = `De acuerdo con la ficha de <strong>${mascota.nombre}</strong> (${mascota.especie}, ${edadStr}):<br>`;
        
        if (vacunas.length === 0) {
            html += `<div class="ai-card">
                        <div class="ai-card-title"><i class="ph ph-warning"></i> Estado de Inmunización:</div>
                        Actualmente no registra vacunas aplicadas en su carnet digital.
                   </div>`;
        } else {
            html += `<div class="ai-card">
                        <div class="ai-card-title"><i class="ph ph-check-circle"></i> Vacunas Registradas en Ficha:</div>
                        <ul class="ai-list">`;
            vacunas.forEach(v => {
                html += `<li><i class="ph ph-syringe" style="color: var(--primary);"></i> <strong>${v.nombre}</strong> — Registrada el ${v.fecha}</li>`;
            });
            html += `</ul></div>`;
        }

        if (mascota.especie === 'Perro') {
            html += `<br>📋 <strong>Esquema Recomendado (Caninos):</strong> Se sugiere mantener actualizada anualmente la vacuna <em>Antirrábica</em> y el refuerzo de la <em>Séxtuple / Quíntuple</em> (Parvovirus, Moquillo, Hepatitis, Leptospirosis).`;
        } else if (mascota.especie === 'Gato') {
            html += `<br>📋 <strong>Esquema Recomendado (Felinos):</strong> Se sugiere la vacuna <em>Antirrábica</em> y la <em>Triple Felina</em> (Rinotraqueítis, Calicivirus, Panleucopenia).`;
        } else {
            html += `<br>📋 Consultá con tu médico veterinario para el plan sanitario de especies no tradicionales.`;
        }
        return html;
    }

    // 3. Orientación Nutricional Profesional
    if (msg.includes('alimento') || msg.includes('comer') || msg.includes('dieta') || msg.includes('nutricion') || msg.includes('peso')) {
        let pesoInfo = `${mascota.pesoKg || 0} kg`;
        if (mascota.pesoGramos > 0) pesoInfo += ` ${mascota.pesoGramos} g`;
        if ((!mascota.pesoKg || mascota.pesoKg == 0) && (!mascota.pesoGramos || mascota.pesoGramos == 0)) {
            pesoInfo = "No registrado";
        }

        const aniosTotales = (mascota.edadAnios || 0) + ((mascota.edadMeses || 0) / 12);

        return `
            <strong>Análisis Nutricional Personalizado:</strong><br>
            <div class="ai-card">
                <div class="ai-card-title"><i class="ph ph-chart-bar"></i> Ficha Bioquímica de ${mascota.nombre}:</div>
                <ul class="ai-list">
                    <li>🔹 <strong>Especie y Raza:</strong> ${mascota.especie} (${mascota.raza})</li>
                    <li>🔹 <strong>Etapa de Vida:</strong> ${edadStr} — ${aniosTotales < 1 ? 'Cachorro' : (aniosTotales > 7 ? 'Geronte/Senior' : 'Adulto')}</li>
                    <li>🔹 <strong>Peso Corporal:</strong> ${pesoInfo}</li>
                </ul>
            </div>
            <br>💡 <strong>Recomendación Nutricional:</strong> Suministrar alimento balanceado de alta gama formulado específicamente para la etapa de vida y peso de ${mascota.nombre}. Dividir en 2 raciones diarias y asegurar constante hidratación.
        `;
    }

    // 4. Comportamiento y Ejercicio por Raza
    if (msg.includes('raza') || msg.includes('ejercicio') || msg.includes('comportamiento') || msg.includes('actividad') || msg.includes('cuidado')) {
        return `
            <strong>Ficha de Cuidados de Raza (${mascota.raza}):</strong><br>
            <div class="ai-card">
                <div class="ai-card-title"><i class="ph ph-heartbeat"></i> Recomendaciones para ${mascota.nombre}:</div>
                • <strong>Actividad Física:</strong> Para su edad (${edadStr}), requiere caminatas regulares y estimulación de juegos.<br>
                • <strong>Salud Mental:</strong> Los juegos interactivos reducen el estrés en el hogar y evitan conductas destructivas.
            </div>
        `;
    }

    // Respuesta Inteligente por Defecto
    return `Comprendido tu mensaje referente a <strong>${mascota.nombre}</strong> (${mascota.especie}, ${edadStr}, Raza ${mascota.raza}). Sus datos médicos y vacunas están sincronizados con el panel central. ¿Deseás profundizar sobre sus vacunas pendientes o plan nutricional?`;
}

// Helper Alertas
function mostrarAlerta(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = `alerta ${tipo}`;
    elemento.classList.remove('oculto');
}
