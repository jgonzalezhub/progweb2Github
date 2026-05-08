# EXAMEN — Reto F12: Atomicidad y resiliencia en el flujo de firma de albarán

## Reto

**F12 — Atomicidad y resiliencia en el flujo de firma de albarán**

Manejo de fallos parciales en cadenas con efectos secundarios externos. El flujo de firma
de un albarán involucra dos llamadas a Cloudinary (imagen de firma + PDF) y una escritura
en MongoDB. Si algún paso intermedio falla, el estado puede quedar inconsistente.

---

## Parte 1 — Tarea técnica

### 1. Puntos de fallo entre líneas 153 y 176 (antes del cambio)

| Línea aprox. | Operación | Fallo posible |
|---|---|---|
| 158 | `uploadImage(req.file.buffer, ...)` | Cloudinary no disponible, buffer inválido, Sharp error |
| 162-164 | Asignación `note.signed = true`, etc. | Ninguno (operaciones síncronas en memoria) |
| 167-171 | `note.populate([...])` | MongoDB caído, documento referenciado borrado |
| 174 | `generateDeliveryNotePDF(note)` | PDFKit error, datos corruptos |
| 175-178 | `uploadPDF(pdfBuffer, ...)` | Cloudinary no disponible, cuota agotada, timeout |

El punto crítico es: **`uploadImage` puede tener éxito (imagen ya en Cloudinary) pero
`uploadPDF` fallar después**. Resultado sin compensación: imagen huérfana en Cloudinary,
`note.signed = false` en BD (correcto, ya que `save()` aún no se ejecutó).

### 2. Compensación implementada

Se añadió `let signaturePublicId = null` antes del bloque `try`. Una vez que `uploadImage`
tiene éxito, se guarda `signaturePublicId = signatureResult.public_id`. En el bloque
`catch`, si `signaturePublicId` tiene valor, se invoca `deleteFile(signaturePublicId)` para
borrar la firma ya subida antes de responder con error.

```js
// En el catch:
if (signaturePublicId) {
  await deleteFile(signaturePublicId).catch((cleanupErr) =>
    console.error('Error limpiando firma huérfana de Cloudinary:', cleanupErr)
  );
}
```

La llamada a `deleteFile` está envuelta en `.catch()` para que un fallo en la limpieza no
enmascare el error original ni deje la respuesta HTTP colgada.

### 3. Test implementado

Fichero: `tests/deliverynote.test.js`
Describe: `PATCH /api/deliverynote/:id/sign - compensación si uploadPDF falla`

El test:
1. Crea un albarán válido.
2. Hace que `uploadPDF` rechace con `mockRejectedValueOnce`.
3. Envía la petición de firma con un buffer de imagen falsa.
4. Verifica `res.status === 500`.
5. Verifica `note.signed === false` en BD (consultando directamente el modelo).
6. Verifica `storage.deleteFile` fue llamado con `'bildyapp/signatures/test'` (el
   `public_id` que devuelve el mock de `uploadImage`).

---

## Parte 2 — Respuestas socráticas

### Pregunta 1
**`src/controllers/deliverynote.controller.js:153-160` — Si `uploadImage` tiene éxito pero
MongoDB se cae antes de `note.save()` (176), ¿qué estado queda en Cloudinary y BD?
¿Cómo limpiarías huérfanos?**

**Estado resultante:**
- **Cloudinary:** La imagen de firma existe en `bildyapp/signatures/<id>`. Es un huérfano
  porque ningún documento en MongoDB la referencia.
- **BD:** `note.signed = false` (el documento nunca se guardó; el `true` solo estaba en
  memoria).

**Limpieza de huérfanos:**
La compensación ya implementada (bloque `catch` con `deleteFile`) cubre este escenario,
porque si `note.populate` o cualquier paso posterior lanza, `signaturePublicId` ya está
asignado y se llama a `deleteFile`.

Para huérfanos que escapan al `catch` (p. ej. crash del proceso justo después de `uploadImage`
y antes de llegar al `catch`), las opciones son:

1. **Trabajo de reconciliación periódico:** un cron consulta Cloudinary (API de listado por
   prefijo `bildyapp/signatures/`) y compara los `public_id` con los `signatureUrl` de los
   albaranes firmados en MongoDB. Los que no tienen correspondencia se borran.
2. **Campo transitorio en BD:** guardar `pendingSignaturePublicId` en el documento antes de
   subir la imagen y borrarlo al finalizar con éxito. Un proceso de limpieza puede
   detectar documentos con este campo y cuya `signedAt` esté ausente.
3. **TTL en Cloudinary:** configurar reglas de expiración automática para archivos en la
   carpeta `bildyapp/signatures/` sin etiqueta `confirmed`, añadiendo dicha etiqueta solo
   al completar el flujo correctamente.

---

### Pregunta 2
**`src/config/socket.js:29` — Socket join `user.company.toString()`. Si emite
`deliverynote:signed` antes de que `note.save()` complete, los demás verán evento pero la
BD no estará firmada. ¿Cómo garantizarías consistencia?**

En el código actual el emit **ya ocurre después de `note.save()`** (líneas 183-184 están
tras la línea 181), por lo que en el flujo normal no hay inconsistencia.

Sin embargo, si el emit se moviera antes (o si `save()` tardara y los clientes consultaran
la BD inmediatamente tras recibir el evento), los clientes verían `signed: false`.

**Estrategias para garantizar consistencia:**

1. **Mantener el orden actual:** emitir siempre después de un `save()` exitoso. Regla
   simple y efectiva para este caso.
2. **MongoDB Change Streams:** en lugar de emitir desde el controlador, suscribirse a los
   cambios de la colección `deliverynotes` y emitir el evento Socket.IO solo cuando
   MongoDB confirma la escritura. Desacopla el evento de la petición HTTP.
3. **Patrón Outbox transaccional:** guardar el evento pendiente en una colección `events`
   dentro de la misma sesión Mongoose que el `save()`. Un worker separado lee los eventos
   no enviados y los emite, garantizando que el evento nunca se pierde ni se adelanta a la
   escritura.

---

### Pregunta 3
**`src/services/storage.service.js:4-22` (`uploadImage`) — Sharp redimensiona a 800px con
`withoutEnlargement: true`. Si la firma original es 100x50px, ¿qué hace esa opción?
¿Por qué es importante aquí?**

Con `withoutEnlargement: true`, Sharp **no agranda** la imagen si su dimensión original ya
es menor que el tamaño objetivo. Una imagen de 100×50px saldría exactamente a 100×50px,
no a 800×400px.

Sin esta opción, Sharp escalaría la imagen a 800px de ancho, lo que provocaría:
- **Pérdida de calidad:** la imagen quedaría pixelada o borrosa porque se interpola más
  allá de su resolución nativa.
- **Aumento innecesario de tamaño de fichero:** una firma pequeña pasaría de pocos KB a
  decenas de KB sin ganancia visual.

Para firmas manuscritas, que suelen ser imágenes pequeñas capturadas desde canvas/tablet,
esta opción es crítica: preserva la resolución original sin penalizar las firmas compactas.

---

### Pregunta 4
**`jest.config.js:6-13` excluye `storage.service.js` de cobertura. En
`tests/deliverynote.test.js:7-16` se mockea con `jest.unstable_mockModule`. ¿Diferencia
entre excluir de cobertura y mockear en tests?**

Son mecanismos ortogonales que actúan en distintas capas:

| | Excluir de cobertura | Mockear en tests |
|---|---|---|
| **Qué hace** | El instrumentador de cobertura ignora el fichero: sus líneas no aparecen en el informe ni cuentan para el umbral | Sustituye el módulo real por una implementación controlada en memoria durante la ejecución de tests |
| **El código real se ejecuta** | Sí (si algo lo importa en producción) | No: el mock intercepta todas las importaciones del módulo |
| **Propósito** | No penalizar el umbral por código que depende de servicios externos no testeables | Aislar el código bajo test de dependencias externas (Cloudinary, SMTP…) |
| **Efecto en CI** | El informe de cobertura no baja por líneas no cubiertas en ese fichero | Los tests no hacen llamadas reales a Cloudinary |

En este proyecto se hace ambas cosas a la vez: `storage.service.js` se excluye de
cobertura porque sería injusto contabilizar sus líneas (el código interno de Cloudinary no
se puede ejercitar sin credenciales reales), y se mockea para que los tests no dependan de
una conexión a Cloudinary.

**Se puede excluir sin mockear** (p. ej. un fichero de configuración que no vale la pena
testar). **Se puede mockear sin excluir** (si se quiere rastrear cuántas veces el código
bajo test llama al módulo mockeado y que eso cuente en cobertura del llamador).

---

### Pregunta 5
**`src/controllers/deliverynote.controller.js:162-166` — `note.populate(...)` después de
modificar pero antes de `save()`. ¿Si populate falla, qué pasa? ¿El PDF generado en
línea 169 podría tener datos incorrectos?**

Si `note.populate(...)` lanza una excepción (p. ej. MongoDB caído, o el documento
referenciado fue eliminado por carrera de condición), el flujo salta directamente al bloque
`catch`.

**Consecuencias:**
- `note.save()` **nunca se ejecuta** → el documento en BD conserva `signed: false`. Correcto.
- `generateDeliveryNotePDF` **nunca se llega a llamar** → no se genera ningún PDF.
- Sin compensación: la firma ya estaba subida a Cloudinary (`uploadImage` tuvo éxito),
  por lo que queda como huérfano. Con la compensación implementada, `deleteFile` la borra.

**¿Podría el PDF tener datos incorrectos?** No en este caso, porque el PDF se genera en
la línea 174, *después* del populate. Si populate falla, no llegamos a esa línea.

Sin embargo, si populate tuviera éxito parcial (algunos refs resueltos, otros no), el PDF
se generaría con campos vacíos/undefined para las referencias no populadas. El servicio
`pdf.service.js` ya maneja esto con guards como `if (note.user)`, `if (note.client)`, etc.,
por lo que el PDF sería incompleto pero no rompería el proceso. La solución robusta sería
verificar que todos los refs requeridos quedaron populados antes de generar el PDF.

---

## Proceso

### Rama de trabajo
```
git checkout -b examen
```

### Cambios realizados

**1. `src/controllers/deliverynote.controller.js`**
- Añadido `deleteFile` al import de `storage.service.js`.
- Añadida variable `let signaturePublicId = null` antes del bloque `try` en `signDeliveryNote`.
- Asignado `signaturePublicId = signatureResult.public_id` inmediatamente después de que
  `uploadImage` tiene éxito.
- En el bloque `catch`: si `signaturePublicId` tiene valor, se llama a
  `deleteFile(signaturePublicId)` con `.catch()` interno para no enmascarar el error original.

**2. `tests/deliverynote.test.js`**
- Añadido `describe` block `PATCH /api/deliverynote/:id/sign - compensación si uploadPDF falla`.
- `beforeEach` que limpia el historial de llamadas de los mocks (`mockClear`).
- Test que usa `mockRejectedValueOnce` en `uploadPDF`, verifica `signed: false` en BD y
  que `deleteFile` fue llamado con el `public_id` correcto.

**3. `EXAMEN.md`** (este fichero)
- Análisis de puntos de fallo, implementación de compensación y respuestas socráticas.

### Commits
- `fix: compensación en signDeliveryNote — deleteFile si uploadPDF falla`
- `test: verificar compensación en signDeliveryNote cuando uploadPDF lanza error`
- `docs: EXAMEN.md con respuestas socráticas y descripción del proceso`
