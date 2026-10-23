(() => {
  "use strict";

  const STORAGE_KEY = "solsystem-checklist-cctv-v2";

  const SECTIONS = [
    {
      id: "camaras",
      title: "ÍTEM 1. CÁMARAS — DETALLE",
      items: [
        "Cámara operativa",
        "Imagen nítida / sin ruido",
        "Lente limpio",
        "Enfoque / ángulo correcto",
        "Campo de visión esperado",
        "Carcasa / estado físico",
        "Humedad / condensación",
        "Fijación / anclaje seguro",
        "Visión nocturna correcta",
        "WDR / IR correcto",
        "OSD / Hora / ID visibles",
        "Detección de movimiento",
      ],
    },
    {
      id: "cableado",
      title: "ÍTEM 2. CABLEADO Y CONEXIONES",
      items: [
        "Estado general del cableado",
        "Conectores BNC / RJ45",
        "Sin corrosión en terminales",
        "Etiquetado de cables",
        "Cajas de empalme / canalización",
        "Sin cortocircuitos / fallas",
        "Tierra / protección sobretensión",
        "Estabilidad de comunicación",
      ],
    },
    {
      id: "nvr",
      title: "ÍTEM 3. NVR / XVR / DVR",
      items: [
        "Alimentación / alarmas OK",
        "Canales activos correctos",
        "Programación de grabación",
        "Reproducción de video",
        "Búsqueda por eventos",
        "Exportación de video",
        "Tiempo de retención",
        "Alertas de disco",
        "Limpieza de ventilador / polvo",
        "Backup de configuración",
        "Fecha / hora del equipo",
        "Acceso local operativo",
      ],
    },
    {
      id: "discos",
      title: "ÍTEM 4. DISCOS",
      items: [
        "HDD reconocido por el sistema",
        "Estado SMART saludable",
        "Capacidad / espacio disponible",
        "Sin sectores dañados críticos",
        "Días de grabación almacenados",
        "Verificación grabación más antigua",
        "Backup de configuración crítica",
      ],
    },
    {
      id: "monitores",
      title: "ÍTEM 5. MONITORES",
      items: [
        "Estado del display",
        "Brillo / contraste adecuados",
        "Mouse / teclado operativos",
        "Audio (si aplica)",
        "Secuencias configuradas",
        "Vistas en monitor correctas",
        "Acceso remoto verificado",
        "Notificaciones / alertas UI",
      ],
    },
    {
      id: "poe",
      title: "ÍTEM 6. RED POE / ENERGÍA",
      items: [
        "Estado switch PoE",
        "Entrega de PoE a cámaras",
        "Estabilidad de alimentación",
        "Capacidad / carga del switch",
        "Link de red / velocidad",
        "UPS operativo",
        "Autonomía de batería",
        "Ventilación del rack / equipo",
        "Limpieza del rack",
        "Reinicio post-corte de energía",
      ],
    },
    {
      id: "seguridad",
      title: "ÍTEM 7. FECHA / HORA / SEGURIDAD",
      items: [
        "Hora del sistema correcta",
        "Sincronización NTP",
        "Sin contraseñas por defecto",
        "Permisos / roles adecuados",
        "Logs de acceso revisados",
        "Firmware actualizado / estable",
        "Estabilidad post-actualización",
        "Máscaras de privacidad",
      ],
    },
    {
      id: "pruebas",
      title: "ÍTEM 8. PRUEBAS FINALES",
      items: [
        "Vista en vivo OK",
        "Prueba día / noche",
        "Reproducción verificada",
        "Exportación de video OK",
        "Detección de movimiento OK",
        "Acceso remoto OK",
        "Recuperación post-corte",
        "Alarmas / notificaciones",
        "Sincronización de hora final",
        "Cliente informado del resultado",
      ],
    },
  ];

  const STATUS = [
    { value: "OK", label: "OK" },
    { value: "REG", label: "REG." },
    { value: "MAL", label: "MAL." },
    { value: "NA", label: "N/A" },
  ];

  const form = document.getElementById("checklistForm");
  const sectionsRoot = document.getElementById("checklistSections");
  const toastEl = document.getElementById("toast");
  const pads = {};
  /** @type {Record<string, Array<{ id: string, name: string, dataUrl: string }>>} */
  const sectionPhotos = {};
  const MAX_PHOTOS_PER_SECTION = 6;
  const MAX_PHOTO_EDGE = 1280;
  const PHOTO_QUALITY = 0.72;

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  function uid() {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Imagen inválida"));
        img.onload = () => {
          let { width, height } = img;
          const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(width, height));
          width = Math.round(width * scale);
          height = Math.round(height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", PHOTO_QUALITY));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderPhotoGallery(sectionId) {
    const gallery = document.getElementById(`photos_${sectionId}`);
    if (!gallery) return;

    const photos = sectionPhotos[sectionId] || [];
    gallery.innerHTML = "";

    if (!photos.length) {
      gallery.innerHTML =
        '<p class="photos-empty">Sin fotos aún. Agregue evidencias del trabajo realizado.</p>';
      return;
    }

    photos.forEach((photo) => {
      const fig = document.createElement("figure");
      fig.className = "photo-thumb";
      fig.innerHTML = `
        <img src="${photo.dataUrl}" alt="${photo.name}" />
        <button type="button" class="photo-remove" data-section="${sectionId}" data-photo="${photo.id}" aria-label="Eliminar foto">×</button>
        <figcaption title="${photo.name}">${photo.name}</figcaption>
      `;
      gallery.appendChild(fig);
    });
  }

  async function addPhotos(sectionId, fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) {
      showToast("Seleccione imágenes válidas");
      return;
    }

    if (!sectionPhotos[sectionId]) sectionPhotos[sectionId] = [];
    const room = MAX_PHOTOS_PER_SECTION - sectionPhotos[sectionId].length;
    if (room <= 0) {
      showToast(`Máximo ${MAX_PHOTOS_PER_SECTION} fotos por ítem`);
      return;
    }

    const toAdd = files.slice(0, room);
    try {
      for (const file of toAdd) {
        const dataUrl = await compressImage(file);
        sectionPhotos[sectionId].push({
          id: uid(),
          name: file.name || `foto_${sectionId}.jpg`,
          dataUrl,
        });
      }
      renderPhotoGallery(sectionId);
      if (files.length > room) {
        showToast(`Se agregaron ${toAdd.length}; máximo ${MAX_PHOTOS_PER_SECTION} por ítem`);
      } else {
        showToast(`${toAdd.length} foto(s) agregada(s)`);
      }
    } catch {
      showToast("Error al procesar una foto");
    }
  }

  function removePhoto(sectionId, photoId) {
    sectionPhotos[sectionId] = (sectionPhotos[sectionId] || []).filter((p) => p.id !== photoId);
    renderPhotoGallery(sectionId);
  }

  function clearAllPhotos() {
    Object.keys(sectionPhotos).forEach((key) => {
      sectionPhotos[key] = [];
      renderPhotoGallery(key);
    });
  }

  function renderSections() {
    const frag = document.createDocumentFragment();

    SECTIONS.forEach((section) => {
      sectionPhotos[section.id] = sectionPhotos[section.id] || [];

      const card = document.createElement("article");
      card.className = "section-card";
      card.dataset.section = section.id;

      const head = document.createElement("div");
      head.className = "section-head";
      head.textContent = section.title;
      card.appendChild(head);

      const table = document.createElement("table");
      table.className = "section-table";

      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr>
          <th>Item / Verificación</th>
          ${STATUS.map((s) => `<th class="status">${s.label}</th>`).join("")}
          <th class="obs">Observaciones</th>
        </tr>
      `;
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      section.items.forEach((label, index) => {
        const name = `${section.id}_${index}`;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${label}</td>
          ${STATUS.map(
            (s) => `
            <td class="status">
              <input
                class="status-radio"
                type="radio"
                name="${name}"
                value="${s.value}"
                aria-label="${label}: ${s.label}"
              />
            </td>`
          ).join("")}
          <td class="obs">
            <input
              class="obs-input"
              type="text"
              name="${name}_obs"
              placeholder="—"
              maxlength="120"
            />
          </td>
        `;
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      card.appendChild(table);

      const photosBlock = document.createElement("div");
      photosBlock.className = "section-photos no-print";
      photosBlock.innerHTML = `
        <div class="photos-head">
          <span class="photos-title">Fotos de lo realizado</span>
          <div class="photos-actions">
            <label class="btn btn-sm btn-photo">
              Galería
              <input type="file" accept="image/*" multiple hidden data-photo-input="${section.id}" />
            </label>
            <label class="btn btn-sm btn-photo">
              Cámara
              <input type="file" accept="image/*" capture="environment" hidden data-photo-input="${section.id}" />
            </label>
          </div>
        </div>
        <div class="photos-gallery" id="photos_${section.id}"></div>
      `;
      card.appendChild(photosBlock);

      frag.appendChild(card);
    });

    sectionsRoot.appendChild(frag);
    SECTIONS.forEach((section) => renderPhotoGallery(section.id));
  }

  function initPhotoEvents() {
    sectionsRoot.addEventListener("change", (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      const sectionId = input.getAttribute("data-photo-input");
      if (!sectionId) return;
      addPhotos(sectionId, input.files);
      input.value = "";
    });

    sectionsRoot.addEventListener("click", (event) => {
      const btn = event.target.closest(".photo-remove");
      if (!btn) return;
      removePhoto(btn.getAttribute("data-section"), btn.getAttribute("data-photo"));
    });
  }

  function initSignatures() {
    const options = {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "rgb(11, 42, 74)",
      minWidth: 0.6,
      maxWidth: 2.2,
    };

    ["sigTecnico", "sigCliente"].forEach((id) => {
      const canvas = document.getElementById(id);
      const pad = new SignaturePad(canvas, options);
      pads[id] = pad;
      resizeCanvas(canvas, pad);
    });

    window.addEventListener("resize", () => {
      Object.entries(pads).forEach(([id, pad]) => {
        const canvas = document.getElementById(id);
        const data = pad.isEmpty() ? null : pad.toData();
        resizeCanvas(canvas, pad);
        if (data) pad.fromData(data);
      });
    });

    document.querySelectorAll("[data-clear]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-clear");
        pads[id]?.clear();
      });
    });
  }

  function resizeCanvas(canvas, pad) {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width), 280);
    const height = 140;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    pad.clear();
  }

  function collectFormData() {
    const photos = {};
    SECTIONS.forEach((section) => {
      photos[section.id] = (sectionPhotos[section.id] || []).map((p) => ({
        id: p.id,
        name: p.name,
        dataUrl: p.dataUrl,
      }));
    });

    const data = {
      fields: {},
      checkboxes: {},
      radios: {},
      items: {},
      photos,
      signatures: {
        tecnico: pads.sigTecnico && !pads.sigTecnico.isEmpty()
          ? pads.sigTecnico.toDataURL("image/png")
          : null,
        cliente: pads.sigCliente && !pads.sigCliente.isEmpty()
          ? pads.sigCliente.toDataURL("image/png")
          : null,
      },
    };

    const fd = new FormData(form);
    for (const [key, value] of fd.entries()) {
      if (key === "tipo_servicio") {
        if (!data.checkboxes.tipo_servicio) data.checkboxes.tipo_servicio = [];
        data.checkboxes.tipo_servicio.push(value);
        continue;
      }

      if (key.endsWith("_obs") || key.includes("_")) {
        const isItem = SECTIONS.some((s) => key.startsWith(s.id + "_"));
        if (isItem) {
          data.items[key] = value;
          continue;
        }
      }

      data.fields[key] = value;
    }

    form.querySelectorAll('input[type="radio"]:checked').forEach((el) => {
      data.radios[el.name] = el.value;
    });

    return data;
  }

  function applyFormData(data) {
    if (!data) return;

    Object.entries(data.fields || {}).forEach(([name, value]) => {
      const el = form.elements.namedItem(name);
      if (!el || el instanceof RadioNodeList) return;
      if (el.type === "checkbox") return;
      el.value = value ?? "";
    });

    (data.checkboxes?.tipo_servicio || []).forEach((val) => {
      const el = form.querySelector(
        `input[name="tipo_servicio"][value="${CSS.escape(val)}"]`
      );
      if (el) el.checked = true;
    });

    Object.entries(data.radios || {}).forEach(([name, value]) => {
      const el = form.querySelector(
        `input[type="radio"][name="${CSS.escape(name)}"][value="${CSS.escape(value)}"]`
      );
      if (el) el.checked = true;
    });

    Object.entries(data.items || {}).forEach(([name, value]) => {
      if (name.endsWith("_obs")) {
        const el = form.elements.namedItem(name);
        if (el) el.value = value ?? "";
        return;
      }
      const el = form.querySelector(
        `input[type="radio"][name="${CSS.escape(name)}"][value="${CSS.escape(value)}"]`
      );
      if (el) el.checked = true;
    });

    if (data.signatures?.tecnico && pads.sigTecnico) {
      pads.sigTecnico.fromDataURL(data.signatures.tecnico);
    }
    if (data.signatures?.cliente && pads.sigCliente) {
      pads.sigCliente.fromDataURL(data.signatures.cliente);
    }

    SECTIONS.forEach((section) => {
      const list = data.photos?.[section.id];
      sectionPhotos[section.id] = Array.isArray(list)
        ? list.map((p) => ({
            id: p.id || uid(),
            name: p.name || "foto.jpg",
            dataUrl: p.dataUrl,
          })).filter((p) => p.dataUrl)
        : [];
      renderPhotoGallery(section.id);
    });
  }

  function saveDraft() {
    const data = collectFormData();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      showToast("Borrador guardado");
    } catch {
      showToast("Borrador demasiado grande (fotos). Reduzca fotos e intente de nuevo");
    }
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      applyFormData(JSON.parse(raw));
      showToast("Borrador restaurado");
    } catch {
      /* ignore corrupt draft */
    }
  }

  function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
    form.reset();
    pads.sigTecnico?.clear();
    pads.sigCliente?.clear();
    clearAllPhotos();
    setDefaults();
    showToast("Borrador eliminado");
  }

  function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(",");
    const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const binary = atob(parts[1] || "");
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function countPhotos(data) {
    return SECTIONS.reduce(
      (sum, section) => sum + ((data.photos?.[section.id] || []).length),
      0
    );
  }

  function setDefaults() {
    const fecha = form.elements.namedItem("fecha");
    const hora = form.elements.namedItem("hora");
    if (fecha && !fecha.value) {
      fecha.value = new Date().toISOString().slice(0, 10);
    }
    if (hora && !hora.value) {
      const now = new Date();
      hora.value = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
    }
  }

  const EMAIL_TO = "soportesolsystem@gmail.com";

  function validateForSend() {
    const required = ["cliente", "fecha", "hora", "direccion", "tecnico", "rut_cliente"];
    for (const name of required) {
      const el = form.elements.namedItem(name);
      if (!el || !String(el.value || "").trim()) {
        el?.focus();
        showToast(`Complete el campo: ${name.replaceAll("_", " ")}`);
        return false;
      }
    }

    if (!form.querySelector('input[name="estado_final"]:checked')) {
      showToast("Seleccione el estado final");
      return false;
    }

    if (pads.sigTecnico?.isEmpty()) {
      showToast("Falta la firma del técnico");
      return false;
    }

    if (pads.sigCliente?.isEmpty()) {
      showToast("Falta la firma del cliente");
      return false;
    }

    return true;
  }

  function statusLabel(value) {
    const found = STATUS.find((s) => s.value === value);
    return found ? found.label : value || "—";
  }

  function estadoFinalLabel(value) {
    const map = {
      operativo: "Operativo en sitio",
      obs_menores: "Con obs. menores",
      parcial: "Parcial",
      fuera: "Fuera de servicio",
    };
    return map[value] || value || "—";
  }

  function buildEmailSummary(data) {
    const f = data.fields || {};
    const lines = [
      "CHECKLIST CCTV — solsystem",
      "========================================",
      `Cliente: ${f.cliente || "—"}`,
      `Fecha: ${f.fecha || "—"}  Hora: ${f.hora || "—"}`,
      `Dirección: ${f.direccion || "—"}`,
      `Técnico: ${f.tecnico || "—"}`,
      `NVR/XVR/DVR: ${f.nvr || "—"}  Modelo: ${f.modelo || "—"}`,
      `Discos: ${f.discos || "—"}`,
      `Canales: ${data.radios?.canales || "—"}`,
      `Sistema: ${data.radios?.sistema || "—"}`,
      `Tipo servicio: ${(data.checkboxes?.tipo_servicio || []).join(", ") || "—"}`,
      `Estado final: ${estadoFinalLabel(data.radios?.estado_final)}`,
      `RUT cliente: ${f.rut_cliente || "—"}`,
      `Firma técnico (nombre): ${f.nombre_firma_tecnico || "—"}`,
      `Firma cliente (nombre): ${f.nombre_firma_cliente || "—"}`,
      "",
      "Observación en la mantención:",
      f.observacion_general || "—",
      "",
      "========================================",
      "DETALLE DE ÍTEMS",
      "========================================",
    ];

    SECTIONS.forEach((section) => {
      lines.push("");
      lines.push(section.title);
      section.items.forEach((label, index) => {
        const key = `${section.id}_${index}`;
        const status = statusLabel(data.radios?.[key] || data.items?.[key]);
        const obs = data.items?.[`${key}_obs`] || "";
        lines.push(`  • ${label}: ${status}${obs ? ` | Obs: ${obs}` : ""}`);
      });
      const photos = data.photos?.[section.id] || [];
      lines.push(
        photos.length
          ? `  Fotos adjuntas (${photos.length}): ${photos.map((p) => p.name).join(", ")}`
          : "  Fotos adjuntas: ninguna"
      );
    });

    lines.push("");
    lines.push(`Total fotos: ${countPhotos(data)}`);
    lines.push(`Firmas digitales: técnico ${data.signatures?.tecnico ? "OK" : "NO"} · cliente ${data.signatures?.cliente ? "OK" : "NO"}`);
    lines.push(`Enviado desde checklist web solsystem → ${EMAIL_TO}`);

    return lines.join("\n");
  }

  function setEmailButtonsBusy(busy) {
    ["btnEmail", "btnSubmitEmail"].forEach((id) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.disabled = busy;
      if (busy) {
        btn.dataset.label = btn.textContent;
        btn.textContent = "Enviando...";
      } else if (btn.dataset.label) {
        btn.textContent = btn.dataset.label;
      }
    });
  }

  function openMailtoFallback(subject, body) {
    const maxBody = 1800;
    const truncated =
      body.length > maxBody
        ? `${body.slice(0, maxBody)}\n\n[Resumen truncado — use el borrador guardado en el navegador]`
        : body;
    const url = `mailto:${EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(truncated)}`;
    window.location.href = url;
  }

  async function sendEmail() {
    if (!validateForSend()) return;

    const data = collectFormData();
    const summary = buildEmailSummary(data);
    const subject = `Checklist CCTV solsystem — ${data.fields.cliente || "Sin cliente"} — ${data.fields.fecha || ""}`;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* fotos grandes pueden superar cuota; el envío igual continúa */
    }
    setEmailButtonsBusy(true);

    try {
      const formData = new FormData();
      formData.append("_subject", subject);
      formData.append("_template", "box");
      formData.append("_captcha", "false");
      formData.append("empresa", "solsystem");
      formData.append("destinatario", EMAIL_TO);
      formData.append("cliente", data.fields.cliente || "");
      formData.append("fecha", data.fields.fecha || "");
      formData.append("hora", data.fields.hora || "");
      formData.append("direccion", data.fields.direccion || "");
      formData.append("tecnico", data.fields.tecnico || "");
      formData.append("nvr", data.fields.nvr || "");
      formData.append("modelo", data.fields.modelo || "");
      formData.append("discos", data.fields.discos || "");
      formData.append("canales", data.radios?.canales || "");
      formData.append("sistema", data.radios?.sistema || "");
      formData.append("tipo_servicio", (data.checkboxes?.tipo_servicio || []).join(", "));
      formData.append("estado_final", estadoFinalLabel(data.radios?.estado_final));
      formData.append("rut_cliente", data.fields.rut_cliente || "");
      formData.append("observacion_general", data.fields.observacion_general || "");
      formData.append("total_fotos", String(countPhotos(data)));
      formData.append("resumen", summary);

      if (data.signatures.tecnico) {
        formData.append(
          "firma_tecnico",
          dataUrlToBlob(data.signatures.tecnico),
          "firma_tecnico.png"
        );
      }
      if (data.signatures.cliente) {
        formData.append(
          "firma_cliente",
          dataUrlToBlob(data.signatures.cliente),
          "firma_cliente.png"
        );
      }

      SECTIONS.forEach((section) => {
        (data.photos?.[section.id] || []).forEach((photo, index) => {
          const safeName = (photo.name || `foto_${index + 1}.jpg`).replace(/[^\w.\-]+/g, "_");
          formData.append(
            `foto_${section.id}_${index + 1}`,
            dataUrlToBlob(photo.dataUrl),
            `${section.id}_${index + 1}_${safeName}`
          );
        });
      });

      const response = await fetch(`https://formsubmit.co/ajax/${EMAIL_TO}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      if (!response.ok) throw new Error("HTTP " + response.status);

      const result = await response.json().catch(() => ({}));
      if (result.success === "false" || result.error) {
        throw new Error(result.message || "Error FormSubmit");
      }

      showToast(`Checklist enviado a ${EMAIL_TO}`);
    } catch {
      openMailtoFallback(subject, summary);
      showToast(`Se abrió el correo hacia ${EMAIL_TO}`);
    } finally {
      setEmailButtonsBusy(false);
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    sendEmail();
  }

  function init() {
    renderSections();
    initPhotoEvents();
    initSignatures();
    setDefaults();
    loadDraft();

    document.getElementById("btnSave")?.addEventListener("click", saveDraft);
    document.getElementById("btnEmail")?.addEventListener("click", sendEmail);
    document.getElementById("btnClearDraft")?.addEventListener("click", clearDraft);
    form.addEventListener("submit", onSubmit);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
