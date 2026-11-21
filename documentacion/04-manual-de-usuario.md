# Manual de usuario de Capriva

Capriva es el programa donde la Granja Experimental de la UFPSO lleva la historia de cada cabra: quién es, de quién es hija, cuánta leche da, qué vacunas tiene, cuánto pesa, cuándo la montaron y cuándo parió. Con esos datos el sistema avisa lo que está por vencer, arma informes y ayuda a escoger los mejores cruces.

Este manual explica cada pantalla paso a paso. No hace falta saber de computadores para seguirlo. Si es la primera vez que usa el programa, lea los capítulos 1 a 4 en orden y después vaya directo al módulo que necesite.

Capriva tiene dos partes:

- **La página web**, que se abre en el computador. Ahí está todo.
- **La aplicación del celular**, pensada para el corral. Sirve para hacer registros rápidos y evaluaciones aunque no haya señal.

Las dos usan el mismo correo y la misma contraseña, y lo que se guarda en una aparece en la otra.

<!-- Captura sugerida: pantalla de inicio de Capriva con el saludo y las tarjetas de los módulos -->

---

## Contenido

1. [Antes de empezar](#1-antes-de-empezar)
2. [Entrar y salir del sistema](#2-entrar-y-salir-del-sistema)
3. [Cómo está organizada la pantalla](#3-cómo-está-organizada-la-pantalla)
4. [La rutina de trabajo en la granja](#4-la-rutina-de-trabajo-en-la-granja)
5. [Mis Cabras: el inventario del rebaño](#5-mis-cabras-el-inventario-del-rebaño)
6. [El expediente de cada animal](#6-el-expediente-de-cada-animal)
7. [Producción de leche](#7-producción-de-leche)
8. [Reproducción: monta, diagnóstico y parto](#8-reproducción-monta-diagnóstico-y-parto)
9. [Salud y vacunas](#9-salud-y-vacunas)
10. [FAMACHA: control de parásitos por el color del ojo](#10-famacha-control-de-parásitos-por-el-color-del-ojo)
11. [Control de peso](#11-control-de-peso)
12. [Corrales y lotes](#12-corrales-y-lotes)
13. [Genealogía y mejoramiento genético](#13-genealogía-y-mejoramiento-genético)
14. [Bienestar animal (guía MEBA del ICA)](#14-bienestar-animal-guía-meba-del-ica)
15. [Clasificación lineal](#15-clasificación-lineal)
16. [Reportes](#16-reportes)
17. [Alertas](#17-alertas)
18. [Mi perfil](#18-mi-perfil)
19. [Auditoría (solo administrador)](#19-auditoría-solo-administrador)
20. [La aplicación del celular](#20-la-aplicación-del-celular)
21. [Problemas frecuentes](#21-problemas-frecuentes)
22. [Palabras que conviene conocer](#22-palabras-que-conviene-conocer)
23. [Tablas de consulta rápida](#23-tablas-de-consulta-rápida)

---

## 1. Antes de empezar

### Qué necesita

- Un computador con internet y un navegador actualizado (Google Chrome, Microsoft Edge o Firefox).
- La dirección de la página de Capriva. Se la entrega el administrador del sistema; guárdela en favoritos para no tener que escribirla cada vez.
- Un correo y una contraseña. Puede crear su propia cuenta (capítulo 2) o pedírsela al administrador.
- Para la aplicación: un celular Android con cámara.

### Quién usa el sistema

Cada cuenta tiene un **rol**. El rol aparece debajo de su nombre, arriba a la derecha.

| Rol | Para quién es |
|-----|---------------|
| Administrador de granja | El encargado de la granja. Puede usar todos los módulos. |
| Pasante | Estudiantes en práctica. Registran y consultan. |
| Zootecnista | Profesional de zootecnia. |
| Veterinario | Profesional de veterinaria. |
| Técnico | Personal técnico de apoyo. |

Al crear una cuenta desde la página solo se puede escoger entre Administrador de granja y Pasante. Los demás roles los asigna el administrador.

Hay dos funciones reservadas. La **Auditoría** (capítulo 19) solo la ve el administrador del sistema. **Reentrenar el modelo de partos** (capítulo 13) solo lo pueden hacer el administrador, el zootecnista y el veterinario.

### Algunas reglas que conviene saber desde ya

- Los campos con un asterisco rojo (`*`) son obligatorios. Si los deja vacíos, el sistema no guarda y le muestra en rojo qué falta.
- Las fechas se escogen en un calendario que aparece al hacer clic en el campo.
- Los números con decimales se escriben con punto en la página web (3.5) y con coma o punto en el celular.
- La sesión dura 24 horas. Pasado ese tiempo el sistema le pide entrar de nuevo. No se pierde nada de lo que ya guardó.

---

## 2. Entrar y salir del sistema

<!-- Captura sugerida: pantalla de inicio de sesión con las pestañas "Iniciar sesión" y "Crear cuenta" -->

### Iniciar sesión

1. Abra la dirección de Capriva en el navegador.
2. Verá un recuadro blanco con dos pestañas arriba: **Iniciar sesión** y **Crear cuenta**. Deje seleccionada **Iniciar sesión**.
3. En **Correo institucional** escriba su correo (por ejemplo, `nombre@ufpso.edu.co`).
4. En **Contraseña** escriba su contraseña. Si quiere ver lo que escribió, toque el ojo que aparece a la derecha del campo.
5. Si el computador es suyo y nadie más lo usa, marque **Recordarme**. En un computador compartido no lo marque.
6. Haga clic en el botón verde **Iniciar sesión**.

Si los datos están bien, aparece el mensaje "¡Bienvenido!" y entra a la pantalla de inicio. Si aparece "Credenciales incorrectas", revise que el correo esté bien escrito y que no tenga activadas las mayúsculas (tecla Bloq Mayús).

### Crear una cuenta nueva

1. En la pantalla de entrada, haga clic en la pestaña **Crear cuenta**.
2. Llene **Nombre completo** con nombre y apellido.
3. Escriba su **Correo institucional**.
4. En **Rol**, haga clic y escoja **Administrador de Granja** o **Pasante**.
5. Escriba una **Contraseña**. Debajo aparece una barra que dice si es DÉBIL, MEDIA o FUERTE, y una lista de lo que le falta. Para que el sistema la acepte debe cumplir al menos tres de estas condiciones, y se recomienda cumplirlas todas:
   - mínimo 8 caracteres;
   - una letra mayúscula;
   - una letra minúscula;
   - un número;
   - un carácter especial, como `!`, `@`, `#` o `*`.
6. Repita la misma contraseña en **Confirmar contraseña**.
7. Haga clic en **Crear cuenta**. Si todo está bien, el sistema le avisa "¡Cuenta creada!" y lo lleva adentro.

### Cerrar sesión

Arriba a la derecha está el botón **Salir** (una puerta con una flecha). Haga clic ahí cuando termine, sobre todo si el computador es compartido.

### Si olvidó la contraseña

La página no tiene opción para recuperarla por correo. Pida al administrador que le asigne una nueva y, cuando entre, cámbiela desde **Mi perfil → Seguridad** (capítulo 18).

---

## 3. Cómo está organizada la pantalla

<!-- Captura sugerida: barra verde superior con el menú Módulos desplegado -->

### La barra verde de arriba

Esta barra se queda fija mientras usted se mueve por el sistema. De izquierda a derecha tiene:

- **El logo y la palabra Capriva.** Al hacer clic vuelve a la pantalla de inicio desde cualquier parte.
- **El botón Módulos** (un cuadrito con cuatro cuadros). Abre un menú con todos los módulos para saltar de uno a otro sin volver al inicio. El módulo donde usted está aparece marcado con un chulo.
- **Cuatro indicadores** (solo en pantallas anchas):
  - **Animales**: cuántos animales hay registrados. Al hacer clic abre Mis Cabras.
  - **Alertas**: cuántos avisos tiene sin leer. Si hay alguno, aparece un punto rojo. Al hacer clic abre las Alertas.
  - **Leche del mes**: litros registrados en el mes. Abre Producción de leche.
  - **Gestantes**: cabras preñadas pendientes de parir. Abre Reproducción.
  Estos números se actualizan solos cada cinco minutos.
- **Su nombre y su rol.** Al hacer clic abre su perfil.
- **Auditoría** (solo si usted es administrador del sistema).
- **Salir.**

### La pantalla de inicio

Al entrar, Capriva lo saluda por su nombre ("Buenos días", "Buenas tardes" o "Buenas noches" según la hora) y muestra una tarjeta grande por cada módulo, con un dibujo y una explicación corta. Haga clic en cualquier parte de la tarjeta o en el botón **Abrir** para entrar.

Los módulos son:

| Módulo | Para qué sirve |
|--------|----------------|
| Mis Cabras | Registrar cada animal y ver su expediente. |
| Reproducción | Montas, diagnósticos de preñez y partos. |
| Salud y Vacunas | Vacunas, tratamientos y enfermedades, más el resumen FAMACHA. |
| Producción de Leche | Litros de cada ordeño. |
| Control de Peso | Pesajes y condición corporal. |
| Genealogía | Árbol familiar, consanguinidad y selección de cruces. |
| Corrales y Lotes | Corrales, su capacidad y qué animales hay en cada uno. |
| Bienestar Animal | Evaluación de la granja con la guía MEBA del ICA. |
| Clasificación Lineal | Calificación del cuerpo y la ubre de cada cabra. |
| Reportes | Indicadores e informes en Excel o PDF. |
| Alertas | Vacunas por aplicar, partos próximos y aplicaciones vencidas. |

### Botones que se repiten en todo el sistema

| Botón | Qué hace |
|-------|----------|
| Flechas en círculo (Actualizar o Recargar) | Vuelve a traer los datos del servidor. Úselo si alguien más acaba de registrar algo. |
| Lápiz (Editar) | Abre el registro para corregirlo. |
| Ojo (Ver o Detalles) | Muestra toda la información del registro. |
| Caneca (Eliminar) | Borra el registro. Siempre pide confirmación. |
| X arriba a la derecha | Cierra la ventana sin guardar. |
| Cancelar | Sale del formulario sin guardar. |

---

## 4. La rutina de trabajo en la granja

Capriva es útil cuando los datos están al día. Esta es una rutina sugerida. Ajústela a como trabajen en la granja.

**Todos los días**

- Registrar los litros de cada cabra en ordeño (capítulo 7).
- Anotar cualquier vacuna, tratamiento o enfermedad (capítulo 9).
- Registrar las montas del día (capítulo 8).
- Revisar las Alertas (capítulo 17).

**Cuando ocurra**

- Registrar cada parto apenas suceda. El sistema crea las crías solo (capítulo 8).
- Registrar los animales que llegan y cambiar el estado de los que se venden, mueren o se regalan (capítulo 5).

**Cada semana o cada quince días**

- Hacer los diagnósticos de preñez pendientes (capítulo 8).
- Revisar FAMACHA a las cabras, sobre todo en época de lluvia (capítulo 10).

**Cada mes**

- Pesar a los animales y anotar la condición corporal (capítulo 11).
- Revisar los informes del mes en Reportes (capítulo 16).

**Una o dos veces al año**

- Hacer la evaluación de bienestar animal (capítulo 14).
- Hacer la clasificación lineal de las cabras unos 45 días después del parto (capítulo 15).

**Un consejo:** casi todos los registros diarios se hacen desde el **expediente** de cada animal (capítulo 6). Los módulos de Producción, Salud y Peso sirven sobre todo para consultar, corregir y ver el resumen de todo el rebaño. En el corral, la app del celular es la forma más rápida (capítulo 20).

---

## 5. Mis Cabras: el inventario del rebaño

<!-- Captura sugerida: Inventario de Animales con las tarjetas de las cabras -->

Aquí está la lista de todos los animales. Se llega desde la tarjeta **Mis Cabras** del inicio o desde **Módulos → Mis Cabras**.

### Lo que se ve en la pantalla

Arriba aparece el título **Inventario de Animales**, cuántos animales hay en la lista y cuántos son hembras y machos. Debajo están:

- Una **barra de búsqueda**.
- Unos **botones de estado**: Activos, Vendidos, Muertos, Donados, Descartados y Todos. Al entrar está seleccionado **Activos**, es decir, los animales que siguen en la granja.
- Los botones **Recargar**, **Filtros**, **CSV** y **Nuevo animal**.

Cada animal aparece en una tarjeta con su foto, si es macho o hembra, su estado, su tipo de estado (si es hembra), el nombre, las chapetas, la raza, la edad, el peso al nacer y el corral.

En las chapetas, la letra **N** indica la chapeta nueva y la **V** la vieja.

### Buscar un animal

Escriba en la barra de búsqueda el número de la chapeta (nueva o vieja) o el nombre. La lista se filtra mientras escribe.

Si no aparece, revise el botón de estado. Un animal vendido no sale en "Activos"; toque **Todos** para buscar en todo el historial.

### Filtrar por sexo o raza

1. Haga clic en **Filtros**.
2. Escoja el **Sexo** (Macho o Hembra) o la **Raza**.
3. Para volver a ver todo, haga clic en **Limpiar filtros**.

### Descargar la lista

El botón **CSV** descarga un archivo con los animales que se ven en ese momento (con chapetas, nombre, sexo, raza, estado, corral y lote). El archivo se abre en Excel.

### Registrar un animal nuevo

1. Haga clic en el botón verde **Nuevo animal**.
2. Se abre el formulario **Registrar nueva cabra**. A la izquierda está la foto y a la derecha unas secciones que se abren y cierran al hacer clic en el título. Cuando una sección está completa aparece un chulo verde; si tiene un error, aparece la palabra **Revisar**.

**Fotografía**

1. Haga clic en **Subir foto** y escoja la imagen desde el computador.
2. Debe ser JPG o PNG y pesar menos de 5 MB.
3. Si se equivocó de foto, haga clic en **Eliminar foto** y suba otra.

La foto no es obligatoria, pero ayuda mucho a reconocer al animal.

**Sección 1: Identidad básica** (obligatoria)

- **Chapeta nueva** y **Chapeta vieja**. Escriba al menos una de las dos. Las cabras nuevas suelen tener solo la nueva y las viejas solo la vieja. Si tiene ambas, escriba las dos.
- **Nombre** (obligatorio). Por ejemplo: Luna.
- **Sexo** (obligatorio): Macho o Hembra.
- **Raza** (obligatoria): escoja de la lista.

**Sección 2: Fechas importantes**

- **Fecha de nacimiento**. Es opcional porque hay cabras viejas sin fecha conocida. Si la escribe, a la izquierda aparece la edad actual calculada.
- **Fecha de ingreso al rebaño**. Es solo de referencia: el sistema no la guarda.

**Sección 3: Características físicas**

- **Color de pelaje**: Blanco, Negro, Marrón, Beige, Gris, Manchado o Multicolor.
- **Propósito**: solo de referencia, no se guarda.
- **Peso al nacimiento (kg)**: por ejemplo 3.5.
- **Peso actual (kg)**: tampoco se guarda aquí. Los pesos se registran en el expediente (capítulo 11).

**Sección: Ubicación (corral / lote)**

- Escoja el **Corral**. Al lado de cada corral aparece su tipo y cuántos animales tiene frente a su capacidad, por ejemplo "(12/30)".
- Al escogerlo, el sistema muestra el tipo, el lote, la ocupación y el rango de peso del corral.
- Puede aparecer una advertencia en amarillo si el corral está lleno, si es de machos y el animal es hembra, si es de gestantes y el animal es macho, o si el peso supera el máximo del corral. Son avisos: el sistema deja guardar, pero conviene revisarlo.

Si todavía no hay corrales creados, primero créelos en el módulo Corrales (capítulo 12).

**Sección 4: Estado del animal**

- **Estado general**: Activo, Vendido, Muerto o Donado. "Activo" significa que el animal sigue en la granja. Use los otros solo si se vendió, murió o se regaló.
- **Tipo de estado** (solo hembras). Toque la opción que corresponda:

| Tipo de estado | Cuándo usarlo |
|----------------|---------------|
| Producción | Ya parió y está dando leche (se ordeña). |
| Seca | Ya ha parido antes, pero ahora no da leche. |
| Preñada | Está esperando cría. |
| Cabretona | Hembra joven ya crecida que todavía no ha parido. |
| Cabrita | Cría hembra, todavía pequeña. |
| Sin definir | Todavía no se sabe o no aplica. |

  No hace falta cambiar esto a mano después: el sistema lo actualiza solo cuando en Reproducción se registra que la cabra quedó preñada o que parió.

- Si escoge **Muerto**, debe escribir el **Motivo de muerte** (por ejemplo: enfermedad, accidente, depredador, nació muerta).
- Si escoge **Vendido** o **Donado**, puede escribir el detalle: a quién se vendió, por qué se descartó, etc.

**Sección 5: Genealogía**

Hay dos campos para anotar el código del padre y de la madre, pero son solo una nota y no se guardan. El padre y la madre de verdad se vinculan en el módulo **Genealogía** después de guardar el animal (capítulo 13).

**Sección 6: Observaciones**

Cualquier dato útil: señas particulares, comportamiento, antecedentes de salud.

**Guardar**

Haga clic en **Registrar cabra**. Aparece "Cabra registrada correctamente" y vuelve a la lista. Si falta algo obligatorio, la sección con el problema se abre sola y muestra el error en rojo.

Para salir sin guardar, haga clic en **Cancelar** o en la X de arriba.

### Ver los datos de un animal

En la tarjeta del animal hay estos botones:

- **Ver Expediente** (botón verde grande): abre la hoja completa del animal con todos sus registros. Se explica en el capítulo 6.
- **Editar**: abre el formulario para cambiar datos.
- **Ver**: muestra una ventana con la foto y los datos principales. Desde ahí también hay un botón **Editar**.
- **Pesa** (icono morado): abre el expediente para registrar un pesaje.
- **Caneca** (rojo): da de baja al animal.

### Corregir los datos de un animal

1. Busque el animal en Mis Cabras.
2. Haga clic en **Editar** en su tarjeta.
3. Cambie lo que necesite.
4. Haga clic en **Guardar cambios**.

### Registrar que un animal se vendió, murió o se regaló

Use **Editar** y cambie el **Estado general** en la sección 4. Escriba el motivo o detalle y guarde. El animal sale de la lista de Activos, pero su historia completa se conserva y se puede consultar con los botones de estado (Vendidos, Muertos, Donados o Todos).

### Dar de baja con la caneca

El botón rojo de la caneca pregunta "¿Dar de baja?" y, si confirma, deja al animal en estado **Muerto**. El registro no se borra: se conserva para la auditoría.

**Cuidado:** use la caneca solo cuando el animal haya muerto. Si se vendió o se regaló, use **Editar** y escoja el estado correcto, porque la caneca siempre lo marca como muerto. Después de usar la caneca, entre a Editar y escriba el motivo de muerte.

---

## 6. El expediente de cada animal

<!-- Captura sugerida: expediente de una cabra con la pestaña Producción abierta -->

El expediente es la hoja de vida del animal. Se abre con **Ver Expediente** desde la tarjeta en Mis Cabras.

### La parte de arriba

Muestra la foto, el nombre, las chapetas, si es macho o hembra, el estado y el tipo de estado. Debajo aparecen la raza, la edad, el peso al nacer y el corral. Si el animal tiene observaciones o un motivo de estado (por ejemplo, el motivo de muerte), también salen aquí.

El botón **Volver** regresa a la pantalla anterior.

Para corregir los datos del animal, vuelva a Mis Cabras y use **Editar** en su tarjeta. El botón Editar del expediente lo lleva a la lista de Mis Cabras, no directamente al formulario.

### Las pestañas

Debajo hay seis pestañas. Cada una muestra un tipo de registro y tiene sus propios botones para agregar uno nuevo.

| Pestaña | Qué muestra | Qué se puede registrar |
|---------|-------------|------------------------|
| Producción | Ordeños, total de litros. | Nuevo ordeño (solo hembras). |
| Salud | Vacunas, tratamientos y enfermedades. | Vacuna, Tratamiento, Enfermedad. |
| Pesaje | Pesos, cambio frente al pesaje anterior. | Registrar pesaje. |
| Reproducción | Montas, resultados, partos. | Registrar monta (solo hembras). |
| FAMACHA | Evaluaciones del color del ojo. | Nueva evaluación. |
| Genealogía | Padre y madre. | Se vinculan en el módulo Genealogía. |

Cada pestaña tiene un botón de flechas para actualizar. Si no hay registros, aparece un mensaje y un botón para registrar el primero.

Los formularios que se abren desde el expediente ya traen el animal escogido, así que no hay que buscarlo. Los pasos de cada formulario se explican en los capítulos siguientes:

- Nuevo ordeño: capítulo 7.
- Registrar monta: capítulo 8.
- Vacuna, Tratamiento y Enfermedad: capítulo 9.
- FAMACHA: capítulo 10.
- Registrar pesaje: capítulo 11.

En la pestaña **Genealogía** se ven el padre y la madre. Si no están registrados, use el botón **Ver árbol completo**, que lleva al módulo Genealogía.

---

## 7. Producción de leche

<!-- Captura sugerida: módulo Producción de Leche con las tarjetas de los ordeños -->

### Registrar un ordeño

Los ordeños se registran desde el **expediente** de cada hembra.

1. Abra el expediente de la cabra (Mis Cabras → Ver Expediente).
2. Entre a la pestaña **Producción**.
3. Haga clic en **Nuevo ordeño**.
4. Llene el formulario **Registrar Producción de Leche**:

**Información básica**

- **Fecha de Ordeño** (obligatoria). Viene con la fecha de hoy.
- **Hora de Ordeño** (opcional). En la página web se registra un único ordeño en la mañana.

**Cantidad producida**

- **Cantidad de Leche (litros)** (obligatoria). Use punto para los decimales, por ejemplo `2.5`. Acepta hasta dos decimales.

**Composición y calidad** (si tienen análisis de laboratorio)

- **Calidad de la Leche**: Excelente, Buena, Regular o Mala.
- **% Grasa** (normal entre 3.0 y 5.0).
- **% Proteína** (normal entre 2.8 y 3.8).
- **% Lactosa** (normal entre 4.2 y 4.8).

**Parámetros físico-químicos** (opcionales)

- **Temperatura** (óptimo entre 2 y 6 °C).
- **pH** (entre 6.5 y 6.8).
- **Densidad** (entre 1.028 y 1.034 g/ml).

**Control sanitario**

- **Recuento de Células Somáticas**. Lo óptimo es menos de 400.000 células por mililitro. Un valor alto puede indicar mastitis.
- **Presencia de antibióticos detectada**. Si la marca, aparece una advertencia: esa leche no debe venderse y hay que descartarla.

**Condiciones**

- **Estado del Animal**: Normal, Estresado, Enfermo o En recuperación.
- **Condiciones de Ordeño**: Óptimas, Buenas, Regulares o Deficientes.
- **Observaciones**.

5. Haga clic en **Guardar Registro**.

Solo la fecha y los litros son obligatorios. Si no tiene los demás datos, déjelos vacíos.

### Consultar la producción del rebaño

Entre a **Producción de Leche** desde el inicio o el menú Módulos. Arriba hay tres números: cuántos registros hay, los litros totales y el promedio por ordeño.

Debajo puede buscar por el nombre o código de la hembra y filtrar por calidad. Cada tarjeta muestra la cabra, la fecha, los litros, la grasa y la proteína, con tres botones:

- **Editar**: corrige el registro.
- **Detalles**: muestra toda la información.
- **Caneca**: elimina el registro. Esta acción no se puede deshacer; el sistema pregunta antes.

En la app del celular se pueden registrar ordeños de la mañana, de la tarde o del día completo (capítulo 20).

---

## 8. Reproducción: monta, diagnóstico y parto

<!-- Captura sugerida: módulo Reproducción con una tarjeta pendiente y otra gestante -->

El ciclo reproductivo de cada cabra tiene tres pasos y el sistema los encadena:

1. **Monta o servicio**: se registra el día que la cubren.
2. **Diagnóstico**: entre 21 y 30 días después se confirma si quedó preñada.
3. **Parto**: se registra cuando pare. Las crías quedan creadas solas en Mis Cabras.

### Paso 1. Registrar la monta

La monta se registra desde el **expediente** de la hembra.

1. Abra el expediente de la cabra.
2. Entre a la pestaña **Reproducción**.
3. Haga clic en **Registrar monta**.
4. Escoja el **Tipo de servicio**:

| Tipo | Qué significa |
|------|---------------|
| Monta Natural | El macho montó a la hembra. |
| Inseminación Artificial | Se le aplicó semen con pajilla, sin macho. |
| Transferencia de Embrión | El veterinario le implantó un embrión de otra cabra. |

5. Escoja el **Macho**. En monta natural es obligatorio. En inseminación o transferencia es opcional: escójalo si sabe de qué macho es el semen o el embrión, porque así la cría queda con su padre registrado.
6. Revise la **Fecha de servicio** (viene con la de hoy).
7. Escriba **Observaciones** si hace falta.
8. Haga clic en **Guardar**.

La monta queda en estado **Pendiente** hasta que se haga el diagnóstico.

### Paso 2. Registrar el diagnóstico de gestación

El diagnóstico dice si la cabra quedó preñada. Se confirma con ecografía a partir de unos 30 días de la monta o, si no hay ecógrafo, porque la cabra no volvió a entrar en celo a los 21 días.

1. Entre al módulo **Reproducción**.
2. Busque la tarjeta de la monta (las pendientes tienen la etiqueta "Pendiente").
3. Haga clic en **Registrar diagnóstico**.
4. Verifique que en **Monta a diagnosticar** esté la cabra correcta. Debajo aparecen la hembra, el macho y la fecha del servicio.
5. Escoja el **Resultado del diagnóstico**:
   - **Gestante (preñada)**: la cabra quedó preñada. Aparece la **Fecha estimada de parto**, calculada sola como la fecha del servicio más 150 días. Puede corregirla si el veterinario indica otra.
   - **Dudoso (repetir en 7-15 días)**: no se pudo confirmar. La monta sigue pendiente y hay que volver a revisar.
   - **Vacía / No gestante**: no quedó preñada. La monta se cierra. En la tarjeta aparecerá con la etiqueta "Aborto", que es como el sistema marca una monta que no prendió.
6. Escriba en **Observaciones del diagnóstico** el método usado y lo que dijo el veterinario.
7. Haga clic en **Guardar**.

Cuando la cabra queda gestante, el sistema cambia su tipo de estado a **Preñada** y la cuenta en el indicador **Gestantes** de la barra de arriba. Quince días antes de la fecha estimada de parto aparece una alerta (capítulo 17).

### Paso 3. Registrar el parto

1. Entre al módulo **Reproducción**.
2. Busque la tarjeta de la cabra gestante (etiqueta "Exitoso (Gestante)").
3. Haga clic en **Registrar parto**.
4. Revise en **Hembra gestante** que sea la correcta. Debajo aparecen la fecha del servicio y el padre.
5. Escoja la **Fecha real del parto**.
6. Escoja la **Dificultad del parto**:

| Dificultad | Qué significa |
|------------|---------------|
| Normal | Parió sola, sin ayuda. |
| Asistido | Hubo que ayudarla a sacar la cría. |
| Difícil (distócico) | La cría venía mal o atascada; costó mucho. |
| Cesárea | El veterinario tuvo que operarla. |

7. Escoja el **Tipo de parto**: **Sencillo** (1 cría), **Gemelar** (2 crías) o **Trillizo** (3 crías).
8. Para cada cría aparece un recuadro. Llene:
   - **Sexo**: Hembra o Macho.
   - **Estado al nacer**: Nació viva o Nació muerta.
   - **Nombre** (opcional).
9. Escriba en **Observaciones del parto** las complicaciones, los medicamentos usados o cómo quedaron las crías.
10. Haga clic en **Guardar**.

Al guardar, el sistema hace varias cosas solo:

- Crea cada cría como un animal nuevo en **Mis Cabras**, con la raza de la madre y con su padre y madre ya vinculados en la genealogía. Las crías que nacieron muertas quedan registradas con estado Muerto.
- Cambia el tipo de estado de la madre a **Producción**.
- Marca la tarjeta de reproducción como **Ciclo completado**.

Después vaya a Mis Cabras, busque cada cría y use **Editar** para ponerle chapeta, foto, peso al nacer y corral.

### Consultar la reproducción del rebaño

En el módulo **Reproducción** hay cuatro números arriba: total de servicios, pendientes de diagnóstico, gestantes y partos. Puede buscar por el nombre o código de la hembra o del macho y filtrar por resultado.

Cada tarjeta muestra la hembra, el macho, la fecha del servicio y, si aplica, el parto estimado con los días que faltan, el parto real, las crías y la dificultad. El botón **Ver observaciones** despliega las notas.

Los botones de la tarjeta cambian según el momento del ciclo:

| Situación | Botón o etiqueta |
|-----------|------------------|
| Monta sin diagnóstico | Registrar diagnóstico |
| Cabra gestante sin parir | Registrar parto |
| Parto registrado | Ciclo completado |
| Monta que no prendió, aborto o cría muerta | Etiqueta en rojo |

---

## 9. Salud y vacunas

<!-- Captura sugerida: formulario Registrar Vacunación -->

### Registrar una vacuna, un tratamiento o una enfermedad

Se hace desde el **expediente** del animal.

1. Abra el expediente.
2. Entre a la pestaña **Salud**.
3. Haga clic en el botón que corresponda: **Vacuna**, **Tratamiento** o **Enfermedad**.

**Si es una vacuna**

- **Nombre de la Vacuna** (obligatorio).
- **Fecha de Aplicación** (obligatoria).
- **Número de Lote** (obligatorio). Está en el frasco.
- **Laboratorio**.
- **Vía de Administración** (obligatoria): Subcutánea, Intramuscular, Intravenosa u Oral.
- **Dosis Aplicada** (obligatoria), por ejemplo `2 ml`.
- **Veterinario Responsable**.
- **Próxima Dosis / Refuerzo**. Llene esta fecha siempre que la vacuna tenga refuerzo: con ella el sistema genera la alerta quince días antes y avisa si se pasa sin aplicarse.

**Si es una enfermedad**

- **Nombre de la Enfermedad** (obligatorio).
- **Fecha de Detección** (obligatoria).
- **Síntomas Observados** (obligatorio).
- **Diagnóstico del Veterinario**.
- **Nivel de Gravedad** (obligatorio): Leve, Moderada o Grave.
- **Enfermedad contagiosa**. Si la marca, aparece un aviso para vigilar a los demás animales.
- **Requiere aislamiento**.

**Si es un tratamiento**

- **Motivo del Tratamiento** (obligatorio).
- **Medicamento** (obligatorio).
- **Dosis** (obligatoria).
- **Frecuencia** (obligatoria), por ejemplo "Cada 12 horas".
- **Vía de Administración**.
- **Fecha de Inicio** (obligatoria).
- **Fecha Estimada de Fin**. Sirve para la alerta de seguimiento.
- **Resultado del Tratamiento**: cómo evolucionó el animal.

En los tres casos hay un campo de **Observaciones Adicionales**.

4. Haga clic en **Guardar**.

### Consultar la salud del rebaño

En el módulo **Salud y Vacunas** hay cuatro números: total de eventos, vacunas, enfermedades y tratamientos. Puede buscar por animal y usar los botones Todos, Vacunas, Enfermedades y Tratamientos.

Si hay evaluaciones FAMACHA, aparece el **Resumen FAMACHA del rebaño**: cuántos animales hay en cada color y, en rojo, cuántos requieren tratamiento.

Cada tarjeta muestra el animal, el tipo de evento y sus datos. En las vacunas con refuerzo dice la fecha de la próxima dosis y cuántos días faltan. Los botones **Editar** y **Detalles** funcionan igual que en los demás módulos.

---

## 10. FAMACHA: control de parásitos por el color del ojo

FAMACHA es un método sencillo para saber si una cabra tiene anemia por parásitos (principalmente el gusano de cuajar). Se baja el párpado de abajo con el pulgar y se mira el color de la parte de adentro, a la luz del día.

| Puntaje | Color | Qué significa | Qué hacer |
|---------|-------|---------------|-----------|
| 1 | Rojo | Óptimo, sin anemia | Sin tratamiento |
| 2 | Rojo-rosa | Bien, sana | Sin tratamiento |
| 3 | Rosa | Normal, vigilar | Monitorear |
| 4 | Rosa-blanco | Mal, anémica | Desparasitar |
| 5 | Blanco | Crítico, anemia grave | Tratar urgentemente |

### Registrar una evaluación FAMACHA

1. Abra el expediente del animal.
2. Entre a la pestaña **FAMACHA**. Arriba verá la guía de colores para comparar.
3. Haga clic en **Nueva evaluación**.
4. En **Puntuación FAMACHA**, toque el color que más se parezca al que vio. Debajo aparece qué significa y qué hacer.
5. Revise la **Fecha de evaluación**.
6. Escoja el **Ojo evaluado**: Ambos ojos, Ojo derecho u Ojo izquierdo.
7. La **Próxima evaluación sugerida** se llena sola: en 14 días si el puntaje fue 4 o 5, y en 28 días si fue de 1 a 3. Puede cambiarla.
8. Si el puntaje es 4 o 5, la casilla **¿Se aplicó tratamiento?** queda marcada sola. Escriba en **Medicamento / Antihelmíntico aplicado** qué producto usó (por ejemplo, ivermectina o albendazol). Si no se trató, desmarque la casilla.
9. Escriba **Observaciones** si hace falta.
10. Haga clic en **Registrar evaluación**.

En la pestaña queda el último puntaje arriba y la lista de todas las evaluaciones del animal.

---

## 11. Control de peso

### Registrar un pesaje

1. Abra el expediente del animal. También puede usar el botón morado de la pesa en su tarjeta de Mis Cabras.
2. Entre a la pestaña **Pesaje**.
3. Haga clic en **Registrar pesaje**.
4. Llene el formulario:

**Información básica**

- **Tipo de Pesaje** (obligatorio): Nacimiento, Destete, Periódico, Pre-venta o Control de enfermedad.
- **Fecha de Pesaje** (obligatoria) y **Hora de Pesaje**.

**Peso del animal**

- **Peso Actual (kg)** (obligatorio), por ejemplo `25.5`.
- **Peso Anterior (kg)**. Si lo escribe, el sistema calcula la variación.

**Contexto del pesaje**

- **Momento del pesaje**: En la mañana, En la tarde, Antes de alimentar o Después de alimentar.
- **Método de Pesaje**: Báscula Electrónica, Romana Mecánica, Cinta Métrica (estimado) o Dinamómetro.
- **Animal en ayunas**.

**Medidas corporales** (opcionales, en centímetros)

- **Circunferencia de Pecho**: justo detrás de las patas delanteras.
- **Altura a la Cruz**: hasta el punto más alto del hombro.
- **Longitud del Cuerpo**: desde el hombro hasta la nalga.
- **Circunferencia de Abdomen**: en la parte más ancha.

**Condición y estado**

- **Condición Corporal (1-5)**: qué tan flaca o gorda está. 1 es muy flaca, 3 es lo ideal y 5 es obesa. Acepta medios puntos (2.5, 3.5).
- **Estado Nutricional**: Desnutrido, Bajo peso, Normal, Sobrepeso u Obeso.
- **Estado de Salud**: Sano, En observación, Enfermo o En recuperación.
- **Responsable del Pesaje**.
- **Observaciones**.

5. Haga clic en **Guardar Registro**.

En la pestaña Pesaje del expediente aparece el último peso y cuánto subió o bajó frente al anterior: verde con flecha hacia arriba si ganó, rojo con flecha hacia abajo si perdió.

### Consultar los pesajes del rebaño

En el módulo **Control de Peso** hay cuatro números: pesajes totales, peso promedio, pesajes periódicos y pesajes al nacimiento. Puede buscar por animal y filtrar por tipo de pesaje. Cada tarjeta muestra el peso actual, el anterior, la variación, la ganancia diaria y la condición corporal.

---

## 12. Corrales y lotes

<!-- Captura sugerida: módulo Corrales con la barra de ocupación de cada corral -->

Este módulo organiza en qué corral está cada animal. Conviene crear los corrales antes de registrar los animales.

### Crear un corral

1. Entre a **Corrales y Lotes**.
2. Haga clic en **Nuevo corral**.
3. Llene:
   - **Nombre** (obligatorio), por ejemplo "Corral 1".
   - **Lote**, por ejemplo "Lote 1".
   - **Tipo**: General, Gestantes, Ordeño, Lactancia, Levante o Machos.
   - **Capacidad máxima**: cuántos animales caben.
   - **Peso mínimo** y **Peso máximo** (kg): el rango de peso de los animales que deben estar ahí.
   - **Descripción**.
4. Haga clic en **Guardar**.

### Lo que muestra cada corral

Cada tarjeta muestra el tipo, el lote, la ocupación (por ejemplo 12 / 30) con una barra de color, el rango de peso y la descripción. Arriba de la pantalla están el número de corrales, los animales ubicados y la capacidad total.

### Poner un animal en un corral

Los animales se asignan desde Mis Cabras: **Editar** → sección **Ubicación (corral / lote)** → escoger el corral → **Guardar cambios**. Para moverlo a otro corral se hace lo mismo.

### Editar o eliminar un corral

- **Editar** cambia sus datos.
- La **caneca** lo desactiva. Solo funciona si el corral no tiene animales; si los tiene, muévalos primero a otro corral.

---

## 13. Genealogía y mejoramiento genético

<!-- Captura sugerida: árbol genealógico horizontal de 4 generaciones -->

Este módulo tiene dos usos. El primero es llevar el árbol familiar de cada animal. El segundo es ayudar a decidir con qué macho cruzar cada hembra (o al revés) para evitar la consanguinidad y mejorar la producción de leche.

### La portada del módulo

Al entrar verá:

- Cuatro números: animales activos, machos, hembras y animales en el pedigrí (incluye los que ya no están en la granja).
- Los tres pasos del módulo: explorar el linaje, buscar la mejor pareja y evaluar el cruce.
- El panel del **Modelo de predicción de partos** (se explica más abajo).
- Una lista de animales activos con buscador y botones para ver Todos, Machos o Hembras.

Haga clic en un animal para abrir su árbol.

Entre más partos, producción, salud y padres registre, más precisas serán las recomendaciones del sistema.

### El árbol genealógico

El árbol muestra cuatro generaciones de izquierda a derecha: el animal, sus padres, sus abuelos y sus bisabuelos. La línea del padre va arriba (en azul) y la de la madre abajo (en rosado).

**Vincular un padre, una madre o un abuelo**

1. En el árbol, busque el recuadro vacío que dice, por ejemplo, **Vincular padre** o **Vincular abuela**.
2. Haga clic en él.
3. Se abre una ventana con buscador. Escriba el código o el nombre del animal. Solo aparecen los del sexo correcto (machos para padre o abuelo, hembras para madre o abuela), incluidos los que ya no están en la granja.
4. Haga clic en el animal. El vínculo se guarda en el momento.

Si el abuelo o el bisabuelo nunca se registró en el sistema, primero regístrelo en Mis Cabras (con estado Muerto o Vendido si ya no está) y después vincúlelo.

**Quitar un vínculo equivocado**

Pase el cursor del ratón sobre el ancestro. Aparece una X pequeña. Haga clic en ella para quitarlo.

**Botones del árbol**

- **Actualizar**: vuelve a cargar el árbol.
- **Buscar la mejor pareja**: abre el ranking de parejas.
- **Evaluar un cruce**: compara este animal con una pareja específica.

### Buscar la mejor pareja

1. Desde el árbol de un animal, haga clic en **Buscar la mejor pareja**.
2. Ajuste los filtros:
   - **Solo disponibles hoy**: deja por fuera a los animales que no se pueden cruzar en este momento (por ejemplo, una hembra ya preñada).
   - **Solo de la misma raza**.
   - **Consanguinidad máxima de la cría**: Sin límite, Hasta 6,25 % (equivale a primos), Hasta 3,1 % o Sin parentesco.
   - **Mostrar**: los 10, 20 o 50 mejores.
3. Haga clic en **Buscar**.

El sistema evalúa a todos los candidatos del sexo contrario y muestra:

- **El podio** con los tres mejores. Cada uno tiene un puntaje de 0 a 100, una etiqueta (Recomendado, Precaución, No recomendado o Datos insuficientes), la probabilidad de parto, la leche esperada de una hija y la consanguinidad.
- **La tabla de todos los candidatos**, ordenada por puntaje. A igual puntaje va primero el de menor consanguinidad.
- **Una gráfica** de puntaje frente a consanguinidad. Las mejores opciones quedan arriba a la izquierda: puntaje alto y poca consanguinidad.
- **Un resumen escrito por la inteligencia artificial** que compara las opciones.

Haga clic en cualquier candidato para ver el cruce completo.

Si ningún candidato aparece, quite "Solo disponibles hoy" o aumente la consanguinidad máxima.

### Evaluar un cruce

1. Desde el árbol, haga clic en **Evaluar un cruce** (o haga clic en un candidato del ranking).
2. El animal del árbol ya está puesto. En el otro recuadro haga clic en **Elegir macho…** o **Elegir hembra…** y busque la pareja. Con **Cambiar** puede escoger otra.
3. Haga clic en **Evaluar cruce**.

El resultado tiene varias partes:

**Resultado del cruce.** Un puntaje de 0 a 100 con su etiqueta:

| Etiqueta | Qué significa |
|----------|---------------|
| Recomendado | Buen cruce. |
| Precaución | Se puede hacer, pero revise las alertas. |
| No recomendado | Mejor buscar otra pareja. |
| Datos insuficientes | Faltan registros para opinar. |

Al lado aparece qué tan confiable es el resultado (alta, media o baja) y una recomendación escrita.

**Cuatro cifras principales.**

- **Consanguinidad de la cría**: qué tan emparentados son los padres. Menos de 6,25 % es bajo; de 6,25 % a 12,5 % es moderado; más de 12,5 % es alto. La consanguinidad alta trae crías más débiles y menos productivas.
- **Probabilidad de parto exitoso**: estimada con el historial de la granja.
- **Leche esperada de una hija**: litros por día que daría una hija de este cruce en su lactancia adulta.
- **Crías esperadas por parto**: según cuántas crías suele tener la hembra.

**Alertas.** Avisos en amarillo o rojo, como un ancestro repetido o una hembra muy joven.

**Árbol genealógico de la futura cría.** Muestra cómo sería el árbol del cabrito. Los ancestros que aparecen por los dos lados (el del padre y el de la madre) se pintan en ámbar: son la causa de la consanguinidad.

**Producción de leche esperada.** Una franja que muestra el rango probable (con 80 % de probabilidad) frente al promedio del rebaño, y el valor genético del macho y de la hembra con su confiabilidad. La confiabilidad sube con más registros de leche del animal, de sus hijas y de sus padres.

**Qué influye en la probabilidad de parto.** Barras que muestran qué datos suben (verde) o bajan (rojo) la probabilidad para este cruce.

**Ancestros en común.** La lista de antepasados compartidos y cuánto aporta cada uno a la consanguinidad. También dice qué porcentaje del pedigrí de cada padre se conoce. Si es bajo, registre los padres y abuelos para un cálculo más fiable.

**Las dimensiones evaluadas.** Una tarjeta por cada aspecto que se tuvo en cuenta (genética, reproducción, salud, condición corporal, etc.). Con **En qué se basa** ve los datos usados.

**Análisis del asistente de IA.** Un texto que explica el resultado en lenguaje sencillo. Lo redacta una inteligencia artificial instalada en el servidor de la granja, que solo usa las cifras que calculó el sistema. Puede tardar hasta tres minutos en aparecer. Si no le convence la redacción, haga clic en **Regenerar**.

### El modelo de predicción de partos

En la portada del módulo hay un panel que explica de dónde aprende el sistema la probabilidad de parto:

- **Conocimiento zootécnico**: todavía hay pocos partos registrados y el sistema usa reglas de la literatura caprina.
- **Mixto**: combina los partos de la granja con ese conocimiento.
- **Aprendido de la granja**: con suficientes partos, aprende sobre todo de la propia granja.

El panel muestra cuántos partos reales se usaron, qué tan bien acierta y si hay partos nuevos que el modelo todavía no conoce. En ese caso, una persona con rol de administrador, zootecnista o veterinario debe hacer clic en **Reentrenar con los datos de la granja**. Conviene hacerlo cada vez que se acumulen varios partos nuevos.

Ningún modelo acierta al 100 %: cada preñez tiene un componente de azar. La consanguinidad y los valores genéticos, en cambio, se calculan de forma exacta con el pedigrí y la producción.

Si aparece el mensaje "El servicio de inteligencia artificial no está encendido", el árbol funciona igual, pero la evaluación de cruces no. Avise al administrador.

---

## 14. Bienestar animal (guía MEBA del ICA)

<!-- Captura sugerida: formulario de evaluación de bienestar con un indicador abierto -->

Esta evaluación revisa a toda la granja según la guía MEBA (versión 3.0 de 2026) del Instituto Colombiano Agropecuario. Se hace caminando la granja, revisando a una muestra de cabras una por una y pidiendo los papeles al encargado. Puede tomar varias horas; por eso el sistema permite guardar un borrador y terminar otro día.

La evaluación tiene tres grupos con distinto peso en el resultado:

| Grupo | Peso | Qué se revisa |
|-------|------|---------------|
| Recursos | 35 % | Instalaciones: agua, comida, comederos, sombra, corrales y piso. |
| Animal | 55 % | Las cabras de la muestra una por una: gordura, heridas, parásitos, cojeras. Es lo que más pesa. |
| Gestión | 10 % | Papeles y registros: mortalidad, medicamentos, plan sanitario. |

### Empezar una evaluación

1. Entre a **Bienestar Animal**.
2. Haga clic en **Nueva evaluación**.
3. Lea el recuadro **Cómo llenar la evaluación**. Si encuentra palabras que no conoce, abra **Palabras que quizá no conozca**.

### Datos de la visita

- **Fecha**.
- **Tipo de productor**:

| Tipo | Descripción |
|------|-------------|
| Familiar | Hasta 30 animales, amarrados o sueltos cerca de la casa, con un corral pequeño para dormir. |
| Extensivo (semi-estabulado) | Pastan en potreros, orillas de caminos o lomas; hasta unos 300 animales. |
| Semi-intensivo | Pastan de día y se encierran de noche; reciben concentrado o forraje. |
| Intensivo | Siempre encerradas, sin salir a pastorear. |

  En granjas familiares y extensivas, los indicadores que dicen "Solo si están encerradas" quedan como No aplica.

- **¿Cuántas cabras hay en total?** El sistema llena solo el número de animales del rebaño cuando puede.
- **¿Cuántas revisar una por una?** El sistema calcula la muestra mínima que pide el ICA. Escoja cabras de varias edades: crías, jóvenes y adultas.
- **Evaluadores**: los nombres de quienes hacen la visita.
- Marque si la granja tiene el **RSPP** (Registro Sanitario de Predio Pecuario) y la **ASI** (Autorización Sanitaria y de Inocuidad). Si no sabe, pregunte al encargado. Sin estos dos registros la granja no puede quedar en Excelente.

### Calificar cada indicador

Cada grupo se abre al hacer clic en su título y muestra cuántos indicadores van calificados. Cada indicador tiene:

- Unas etiquetas: **Revisar papeles** (hay que pedir un documento), **Solo si están encerradas**, **Contar** (se califica contando animales) y **Hay datos en…** (el sistema ya tiene información de ese tema en otro módulo y se la muestra como ayuda).
- La **pregunta** que hay que responder.
- **Cómo se revisa**: qué mirar y dónde.

Para calificarlo:

1. Haga clic en **Ver qué significa cada puntaje** y lea la descripción de cada nivel.
2. Escoja **100, 55, 20 o 0**. 100 significa que está muy bien y 0 que está mal. Algunos indicadores no tienen los cuatro niveles.
3. En los indicadores marcados **Contar**, escriba cuántos animales (o comederos, bebederos, etc.) revisó y cuántos están bien o cuántos tienen el problema, según lo que pregunte. El sistema calcula el porcentaje y elige el puntaje solo. El segundo número nunca puede ser mayor que el primero.
4. Si el indicador no corresponde a esta granja, haga clic en **No aplica**.
5. Escriba una **Observación** corta: qué vio, dónde, qué animales.
6. En los indicadores de papeles, escriba en **Soporte / documento revisado** qué documento le mostraron.
7. Agregue **fotos de evidencia** con el botón de la cámara. En un celular o tableta, el botón abre la cámara directamente. Las fotos se suben cuando guarda.

Al final del formulario puede escribir las **Observaciones generales de la visita** y subir **Fotos generales**.

### El resultado

En la parte de abajo hay una barra fija que se actualiza mientras califica. Muestra el porcentaje total, el promedio de Recursos, Animal y Gestión, cuántos indicadores faltan y si alguno quedó por debajo de 100.

| Clasificación | Condición |
|---------------|-----------|
| Excelente | 90 % o más, y la granja tiene RSPP y ASI. |
| Alto | 75 % o más. |
| Medio | 50 % o más. |
| Bajo | Menos de 50 %. |

### Guardar

- **Borrador**: guarda lo que lleva aunque falten indicadores. Puede volver otro día y seguir.
- **Finalizar evaluación**: solo funciona cuando todos los indicadores están calificados o marcados como No aplica.

Si guarda y alguna foto no se sube, el sistema avisa. Abra la evaluación con Editar y vuelva a intentarlo.

### Consultar, completar o eliminar evaluaciones

En la lista aparece cada evaluación con su clasificación (o la palabra BORRADOR), el porcentaje, la fecha, el tipo de productor, el número de animales y cuántas fotos tiene.

- El **ojo** muestra el detalle: los puntajes por grupo, la lista **Para mejorar** con los indicadores que quedaron por debajo de 100, y cada indicador con su conteo, observación y fotos. Haga clic en una foto para verla grande.
- El **lápiz** abre la evaluación para completarla o corregirla.
- La **caneca** la elimina junto con sus fotos.

La lista **Para mejorar** es la parte más útil para el encargado: dice exactamente qué hay que arreglar para subir de nivel.

---

## 15. Clasificación lineal

<!-- Captura sugerida: rasgo de la clasificación lineal con el dibujo de referencia y las opciones 1, 2 y 3 -->

La clasificación lineal califica la forma del cuerpo y de la ubre de cada cabra lechera con el método ADGA. Sirve para escoger las mejores hembras como madres de reemplazo.

### Cuándo y cómo hacerla

- Se evalúan **hembras adultas**, idealmente unos **45 días después del parto**, cuando la ubre está bien desarrollada.
- La cabra debe estar **parada en piso plano**, tranquila, con la cabeza en posición normal.
- Se califican 17 rasgos con 1, 2 o 3 (1 = bajo, 2 = intermedio, 3 = alto).

Los rasgos se agrupan en cuatro partes:

| Parte | Puntos | Rasgos |
|-------|--------|--------|
| Apariencia general y capacidad | 25 | Estatura, ancho de pecho, profundidad corporal, ancho de grupa, ángulo de grupa. |
| Estructura y fortaleza lechera | 15 | Angulosidad, calidad de hueso. |
| Sistema mamario | 40 | Inserción anterior de la ubre, altura y anchura de la inserción posterior, ligamento suspensor medio, profundidad de la ubre, colocación y diámetro de los pezones. |
| Patas y pezuñas | 20 | Patas traseras vistas desde atrás y de lado, movilidad y aplomos. |

### Hacer una evaluación

1. Entre a **Clasificación Lineal** y haga clic en **Nueva evaluación**.
2. Lea el recuadro **Cómo hacer la evaluación**. Hay un glosario con palabras como cruz, grupa, corvejón o ligamento suspensor.
3. En **Cabra a evaluar**, busque y escoja la hembra. Solo aparecen hembras.
   - Si la cabra no tiene partos registrados, el sistema avisa que el método está pensado para cabras que ya parieron.
   - Si tiene partos, dice hace cuántos días fue el último y si es buen momento para evaluarla.
4. Revise la **Fecha** y escriba la **Edad (meses)** y el **N° de partos**.
5. Para cada rasgo:
   - Lea desde dónde mirarla ("Mírela: de lado", "desde atrás"…) y **qué mirar**.
   - Compare con el **dibujo de referencia**. Haga clic en el dibujo para verlo grande.
   - Toque **1 · Bajo**, **2 · Intermedio** o **3 · Alto**. Cada opción tiene una descripción corta.
6. Escriba **Observaciones** si algo llama la atención (cojera, ubre desigual, una lesión).
7. Abajo aparece la **Calificación final** sobre 100, la categoría y cuántos rasgos faltan.
8. Cuando estén los 17 rasgos, haga clic en **Guardar y tomar fotos**.

### Las fotos de evidencia

Después de guardar se abre el detalle de la evaluación con seis espacios para fotos:

| Vista | Qué fotografiar |
|-------|-----------------|
| De frente | La cabra completa, de frente. |
| De lado | El cuerpo completo, de lado. |
| Desde atrás | El cuerpo completo, desde atrás. |
| Ubre de atrás | De cerca, la ubre vista desde atrás. |
| Ubre de lado | De cerca, la ubre vista de lado. |
| Patas | Las patas de atrás, con la cabra parada en piso plano. |

Haga clic en **Tomar / subir foto** en cada espacio. En el celular o la tableta se abre la cámara.

### Categorías

| Puntaje | Categoría |
|---------|-----------|
| 90 o más | Excelente |
| 85 a 89 | Muy bueno |
| 80 a 84 | Bueno |
| 70 a 79 | Aceptable |
| 60 a 69 | Regular |
| Menos de 60 | Pobre |

### Consultar evaluaciones

La lista muestra cada cabra con su categoría, sus puntos y la fecha. El **ojo** abre el detalle con el puntaje de cada parte, las fotos y la calificación de cada rasgo. La **caneca** elimina la evaluación.

Una evaluación guardada no se puede editar. Si se equivocó en un rasgo, elimínela y hágala de nuevo.

---

## 16. Reportes

<!-- Captura sugerida: módulo Reportes con el panel de indicadores y la lista de informes -->

### Escoger el periodo

Arriba de la pantalla escoja el periodo que quiere analizar: **Este mes**, **3 meses**, **12 meses**, **Este año** o **Todo**. También puede escribir las fechas exactas en los campos **desde** y **hasta**.

### El panel del hato

Debajo aparecen los indicadores principales del periodo y sus gráficas. Pase el ratón sobre una gráfica para ver los valores exactos.

### Los informes

La lista de informes está agrupada por tema:

| Tema | Informes |
|------|----------|
| Hato | Censo del hato; Ingresos y salidas; Ocupación de corrales. |
| Leche | Producción por mes; Producción por cabra; Registro de ordeños. |
| Reproducción | Servicios y partos; Partos esperados; Desempeño de los machos. |
| Salud | Registro sanitario; Enfermedades frecuentes; Pendientes sanitarios; FAMACHA. |
| Peso | Registro de pesajes; Crecimiento por animal. |
| Evaluaciones | Bienestar animal; Clasificación lineal. |

Los informes con la etiqueta **Hoy** muestran la situación actual y no cambian con el periodo (por ejemplo, el censo o los partos esperados).

### Abrir y descargar un informe

1. Haga clic en el informe.
2. Verá sus indicadores, sus gráficas y una tabla de detalle.
3. En la tabla puede:
   - buscar con **Buscar en la tabla**;
   - ordenar haciendo clic en el título de una columna;
   - pasar de página con las flechas de abajo.
4. Para descargar, haga clic en **Excel** o en **PDF**. El archivo se guarda en la carpeta de descargas del computador.
5. Para volver a la lista, haga clic en **Todos los informes**.

Si un informe sale vacío, pruebe con un periodo más amplio o revise que se hayan registrado datos en el módulo correspondiente.

---

## 17. Alertas

El sistema revisa los registros y genera tres tipos de aviso:

| Alerta | Cuándo aparece | Prioridad |
|--------|----------------|-----------|
| Vacuna próxima | Faltan 15 días o menos para una próxima dosis registrada. | Media |
| Parto próximo | Faltan 15 días o menos para una fecha estimada de parto. | Alta |
| Aplicación vencida | Pasó la fecha de una próxima dosis y no se registró la aplicación. | Alta |

Por eso es importante llenar la **Próxima Dosis** al registrar vacunas y confirmar los diagnósticos de preñez: sin esas fechas, el sistema no puede avisar.

### Revisar las alertas

1. Haga clic en **Alertas** en la barra de arriba o en la tarjeta del inicio.
2. Arriba verá cuántas alertas hay de cada prioridad.
3. Filtre por categoría (Todas, Reproducción, Salud, Producción o Críticas) o por prioridad.
4. Cada alerta muestra el animal, la fecha y cuántos días faltan o cuántos lleva atrasada.
5. Haga clic en **Ver Detalle** para ver toda la información.
6. Cuando atienda la alerta, haga clic en **Marcar como Leída**. Con **Marcar Todo Leído** las marca todas de una vez.

Las alertas leídas se recuerdan en el navegador de ese computador. Si entra desde otro computador, volverán a aparecer como no leídas.

Para que una alerta de "Aplicación vencida" desaparezca, registre la vacuna o el tratamiento que faltaba en el expediente del animal.

---

## 18. Mi perfil

Haga clic en su nombre, arriba a la derecha. Se abre una ventana con seis secciones a la izquierda:

| Sección | Qué contiene |
|---------|--------------|
| Datos Personales | Foto, nombre, teléfono, fecha de nacimiento, cédula, dirección, ciudad y departamento. El correo y el rol no se pueden cambiar. |
| Información de Granja | Nombre de la granja, tipo de producción, área, sistema de manejo, capacidad. |
| Ubicación y Clima | Coordenadas, altitud, temperatura y lluvia promedio. |
| Documentación Legal | NIT, registro ICA, registro ganadero, licencia ambiental. |
| Seguridad | Cambio de contraseña. |
| Notificaciones | Qué tipos de aviso quiere recibir. |

### Cambiar sus datos

1. Haga clic en **Editar Perfil**.
2. Cambie lo que necesite.
3. Haga clic en **Guardar Cambios**, o en **Cancelar** para dejarlo como estaba.

### Cambiar la contraseña

1. Entre a **Seguridad**.
2. Escriba la **Contraseña actual**.
3. Escriba la **Nueva contraseña** (mínimo 8 caracteres) y repítala en **Confirmar nueva contraseña**.
4. Haga clic en **Cambiar Contraseña**.

---

## 19. Auditoría (solo administrador)

La auditoría guarda quién hizo qué y cuándo. Solo la ve el administrador del sistema, con el botón **Auditoría** de la barra de arriba.

Arriba aparece el total de acciones y cuántas fueron creaciones, modificaciones y eliminaciones. Puede filtrar por:

- **Módulo**: Animales, Producción, Salud, Reproducción, Pesaje, Genealogía o Usuarios.
- **Acción**: Creaciones, Modificaciones o Eliminaciones.
- **Usuario**.
- **Fechas** desde y hasta.

Cada registro dice qué se hizo, en qué módulo, quién lo hizo y a qué hora. Al hacer clic en la flecha se despliega el detalle: en una modificación se ven el valor anterior y el nuevo de cada campo, y en una eliminación los datos que se borraron.

Sirve para aclarar errores ("¿quién cambió el peso de esta cabra?") y para recuperar datos borrados por equivocación.

---

## 20. La aplicación del celular

<!-- Captura sugerida: pantalla de Inicio de la app con los registros rápidos -->

La app sirve para trabajar en el corral. Su gran ventaja es que funciona **sin señal**: guarda todo en el teléfono y lo envía solo cuando vuelve la conexión.

### Instalarla

1. Pida al administrador el archivo **Capriva.apk** y cópielo al celular.
2. Ábralo desde el celular. Android le pedirá permiso para instalar aplicaciones de orígenes desconocidos; acéptelo para este archivo.
3. Toque **Instalar**.
4. La primera vez que tome una foto o lea un código, la app pedirá permiso para usar la cámara. Acéptelo.

### Entrar

1. Abra Capriva.
2. Escriba el mismo **Correo** y **Contraseña** de la página web.
3. Toque **Entrar**.

La primera entrada necesita internet (wifi o datos). Si sale "No se pudo llegar al servidor", revise la conexión. Debajo hay una opción **Servidor** que solo se cambia si el administrador le indica una dirección nueva.

### Antes de ir al corral

Con internet, entre a **Ajustes** y toque **Actualizar datos**. Así el teléfono descarga la lista de animales y las guías de evaluación (los indicadores de bienestar y los rasgos de clasificación lineal). Sin esa descarga, la app no puede mostrar los animales ni las evaluaciones cuando no hay señal.

En **Ajustes → Guardado en el teléfono** puede ver cuándo fue la última actualización.

### Las cuatro pestañas

En la parte de abajo hay cuatro pestañas:

| Pestaña | Para qué sirve |
|---------|----------------|
| Inicio | Ver si hay conexión, lo que falta por enviar y hacer registros rápidos. |
| Rebaño | Buscar un animal por chapeta, nombre o código QR. |
| Evaluar | Bienestar animal y clasificación lineal. |
| Ajustes | Cuenta, servidor, datos guardados y cerrar sesión. |

### Inicio

Arriba dice si hay **Con conexión** o **Sin conexión**. Sin conexión puede seguir trabajando: todo queda guardado en el teléfono.

Si hay registros guardados sin enviar, aparece cuántos son y, con señal, el botón **Enviar ahora**.

Debajo están los **registros rápidos**: Salud, Pesaje, Leche y FAMACHA. Si tiene evaluaciones sin terminar, también aparecen aquí.

### Hacer un registro rápido

1. En Inicio, toque el tipo de registro (por ejemplo, **Leche**).
2. Escoja el animal. Para leche solo aparecen hembras.
3. Revise la **Fecha**.
4. Llene los datos según el tipo:

**Salud**

- **Qué se hizo**: Vacuna, Tratamiento, Desparasitación, Enfermedad o Cirugía.
- **Producto**, **Dosis**, **Enfermedad** (si aplica) y **Veterinario**.

**Pesaje**

- **Peso (kg)**, entre 0 y 200.
- **Condición corporal**, de 1 a 5 (1 muy flaca, 3 ideal, 5 muy gorda).
- **Cómo se pesó**: Báscula, Cinta o Estimado.

**Leche**

- **Ordeño**: Mañana, Tarde o Todo el día.
- **Litros**, entre 0 y 15.
- **Grasa (%)**, opcional.

**FAMACHA**

- Toque el color que más se parece al de adentro del párpado: Rojo, Rojo rosado, Rosado, Rosado pálido o Blanco (puntajes 1 a 5).
- Active **Se desparasitó** si aplicó tratamiento y escriba el producto.

5. Escriba **Observaciones** si hace falta.
6. Toque **Guardar**.

Si hay señal, el registro se envía de una vez y aparece "Guardado". Sin señal aparece "Guardado en el teléfono. Se enviará cuando haya conexión."

### Rebaño: encontrar un animal

1. Entre a la pestaña **Rebaño**.
2. Escriba la chapeta o el nombre en el buscador, o toque el icono del **código QR** y apunte la cámara al código de la chapeta.
3. Toque el animal para abrir su ficha.

En la ficha están sus datos (chapetas, corral, estado productivo, nacimiento) y los botones para registrarle Salud, Pesaje, Leche o FAMACHA. Si es hembra, también aparece **Clasificación lineal**.

Si la lista sale vacía, conéctese a internet y actualice los datos desde Ajustes.

### Evaluar: bienestar animal en el celular

1. Entre a la pestaña **Evaluar** y escoja **Bienestar** arriba.
2. Toque **Empezar una evaluación** (o **Nueva evaluación**).
3. Llene **La visita**: fecha, tipo de granja, animales en total, animales a revisar (la app calcula la muestra) y quién evalúa.
4. Los indicadores aparecen agrupados en Recursos, Animal y Gestión. Toque cada uno para abrirlo.
5. En cada indicador:
   - Lea la pregunta y **Cómo revisarlo**.
   - Si no corresponde, active **No aplica en esta granja**.
   - Si dice **Contar**, use los botones + y − para indicar cuántos revisó y cuántos están bien o tienen el problema. La app elige la calificación sola. El botón **Usar la muestra** pone el número de animales a revisar.
   - Si no, toque la descripción que más se parece a lo que vio.
   - Tome hasta cuatro **fotos de evidencia** y escriba una **Observación**.
   - Toque **Siguiente indicador**.
6. Marque si la granja tiene **RSPP** y **ASI**, tome hasta ocho fotos generales y escriba las observaciones de la visita.
7. Arriba se ve el resultado parcial y cuántos indicadores van.
8. Para terminar:
   - **Terminar y enviar**: cuando todos están calificados.
   - **Enviar sin terminar**: la envía como borrador para terminarla después en el computador.

La evaluación se guarda sola en el teléfono mientras la llena. Puede cerrar la app y seguir después desde la pestaña Evaluar.

### Evaluar: clasificación lineal en el celular

1. En la pestaña **Evaluar**, escoja **Clasificación lineal** arriba y toque **Empezar una evaluación**. También puede empezar desde la ficha de una hembra.
2. Escoja la **Cabra** (solo hembras), la fecha y, si los sabe, la edad en meses y el número de partos.
3. Toque **Empezar: 17 rasgos**.
4. Cada rasgo ocupa una pantalla con el dibujo de referencia. Toque Bajo, Intermedio o Alto. La app pasa sola al siguiente.
5. Al final tome las **seis fotos** (de frente, de lado, desde atrás, ubre de atrás, ubre de lado y patas). Puede tomar solo las que alcance.
6. En el **Resultado** verá el puntaje sobre 100, la categoría y el puntaje por partes. Toque un rasgo si quiere cambiar su calificación.
7. Toque **Guardar en el sistema**. Solo se activa cuando están los 17 rasgos.

### Sin señal: qué pasa con lo que registro

- Todo lo que guarde sin señal queda en el teléfono y se envía solo cuando vuelve la conexión.
- Para ver qué falta, entre a **Ajustes → Por enviar**. Ahí puede tocar **Enviar ahora**.
- Si el servidor rechazó un registro, aparece con el motivo. Tóquelo para quitarlo y hágalo de nuevo con los datos corregidos.
- Si cierra sesión con registros pendientes, no se pierden: se envían cuando vuelva a entrar.

**Cuidado:** si borra los datos de la aplicación desde la configuración de Android o la desinstala antes de enviar, lo pendiente se pierde.

### Ajustes

- **Cuenta**: su nombre y rol.
- **Servidor**: la dirección del servidor. Solo se cambia si el administrador lo indica. Después de cambiarla, toque **Guardar y probar**.
- **Por enviar**: los registros y evaluaciones pendientes.
- **Guardado en el teléfono**: cuántos animales hay guardados y cuándo se descargaron las guías. El botón **Actualizar datos** los vuelve a descargar.
- **Cerrar sesión**: para volver a entrar necesitará conexión.

---

## 21. Problemas frecuentes

**No puedo entrar: "Credenciales incorrectas".**
Revise el correo letra por letra y que no estén activadas las mayúsculas. Si olvidó la contraseña, pida una nueva al administrador.

**El sistema me sacó y me pide entrar otra vez.**
La sesión dura 24 horas. Entre de nuevo; lo que guardó antes sigue ahí.

**Un animal no aparece en Mis Cabras.**
Revise el botón de estado: puede estar en Vendidos, Muertos o Donados. Toque **Todos** y búsquelo de nuevo.

**No me deja guardar el animal.**
Revise las secciones con la palabra **Revisar**. Lo más común es que falte la chapeta (nueva o vieja), el nombre, el sexo o la raza. Si escogió Muerto, falta el motivo.

**No encuentro dónde registrar un ordeño, un pesaje, una vacuna o una monta.**
Se registran desde el **expediente** del animal (Mis Cabras → Ver Expediente → la pestaña correspondiente) o desde la app del celular.

**No aparece el botón "Nuevo ordeño" ni "Registrar monta".**
Esos botones solo salen para hembras.

**No aparece el botón "Registrar parto".**
Primero hay que registrar el diagnóstico como **Gestante (preñada)**.

**Una alerta de vacuna vencida no se quita.**
Registre la aplicación que faltaba en el expediente del animal.

**La genealogía dice que el servicio de inteligencia artificial no está encendido.**
El árbol funciona, pero la evaluación de cruces no. Avise al administrador.

**El análisis de la IA tarda mucho.**
Es normal que tarde hasta tres minutos. Mientras tanto puede seguir mirando el resto del resultado.

**No se ven las fotos o no se suben.**
Las fotos deben ser JPG o PNG y pesar menos de 5 MB en la ficha del animal. Si el problema sigue, avise al administrador.

**La app dice "No se pudo llegar al servidor".**
Revise que el celular tenga wifi o datos. Si tiene internet y sigue fallando, pregunte al administrador si cambió la dirección del servidor.

**En la app no aparecen los animales o las evaluaciones.**
Conéctese a internet y toque **Ajustes → Actualizar datos**.

**Registré algo mal.**
Use **Editar** en el registro. Si el error está en una clasificación lineal, elimínela y hágala de nuevo. Si borró algo por equivocación, el administrador puede ver los datos borrados en la Auditoría.

---

## 22. Palabras que conviene conocer

| Palabra | Qué significa |
|---------|---------------|
| Aplomos | La forma en que la cabra apoya las patas en el piso. |
| Cabretona | Hembra joven ya crecida que todavía no ha parido. |
| Chapeta | La placa o arete con el número del animal. |
| Condición corporal | Qué tan flaca o gorda está la cabra, de 1 (muy flaca) a 5 (muy gorda). Lo ideal es 3. |
| Consanguinidad | Qué tan emparentados son los padres de una cría. Si es alta, la cría puede salir débil o menos productiva. |
| Corvejón | La articulación que dobla en la pata de atrás. |
| Cruz | La parte más alta de la espalda, encima de las patas delanteras. |
| Distócico | Parto difícil: la cría venía mal o atascada. |
| Ectoparásitos | Bichos por fuera del cuerpo: garrapatas, nuches, piojos. |
| Expediente | La hoja de vida del animal con todos sus registros. |
| FAMACHA | Método para detectar anemia por parásitos mirando el color de adentro del párpado. |
| Gestante | Preñada. |
| Grupa | La cadera: la parte de atrás, arriba de la cola. |
| Hato o rebaño | El conjunto de cabras de la granja. |
| Ligamento suspensor | El "tirante" que sostiene la ubre; se ve como una rayita en el centro. |
| Mastitis | Infección de la ubre. Se nota inflamada, caliente o dura, o la leche sale con grumos. |
| MEBA | Metodología de Evaluación del Bienestar Animal del ICA. |
| Monta o servicio | Cuando se cubre a la hembra, sea con macho, inseminación o embrión. |
| Mortinato | Cría que nació muerta. |
| Pedigrí | El registro de padres, abuelos y bisabuelos de un animal. |
| Prolificidad | Cuántas crías suele tener una hembra por parto. |
| RSPP y ASI | Registros oficiales del ICA para la granja. |
| Seca | Hembra que ya parió antes pero ahora no da leche. |
| Valor genético | Cuánto se espera que un animal transmita a sus hijos en producción de leche. |

---

## 23. Tablas de consulta rápida

### Estados de un animal

| Estado general | Cuándo usarlo |
|----------------|---------------|
| Activo | Sigue en la granja. |
| Vendido | Se vendió. Anote a quién. |
| Muerto | Murió. El motivo es obligatorio. |
| Donado | Se regaló. |
| Descartado | Se sacó de la producción. |

### Tipo de estado de las hembras

| Tipo | Significado | ¿Cambia solo? |
|------|-------------|---------------|
| Cabrita | Cría hembra pequeña. | No |
| Cabretona | Joven crecida que no ha parido. | No |
| Preñada | Esperando cría. | Sí, al registrar el diagnóstico Gestante. |
| Producción | Parió y da leche. | Sí, al registrar el parto. |
| Seca | Ya parió antes, ahora no da leche. | No |

### FAMACHA

| Puntaje | Color | Acción | Próxima revisión |
|---------|-------|--------|------------------|
| 1 | Rojo | Sin tratamiento | 28 días |
| 2 | Rojo-rosa | Sin tratamiento | 28 días |
| 3 | Rosa | Monitorear | 28 días |
| 4 | Rosa-blanco | Desparasitar | 14 días |
| 5 | Blanco | Tratar urgentemente | 14 días |

### Fechas que calcula el sistema

| Dato | Cálculo |
|------|---------|
| Fecha estimada de parto | Fecha de la monta + 150 días. |
| Alerta de parto | 15 días antes de la fecha estimada. |
| Alerta de vacuna | 15 días antes de la próxima dosis. |
| Diagnóstico de preñez | Desde los 21 días (sin ecógrafo) o 30 días (con ecógrafo) después de la monta. |
| Mejor momento para la clasificación lineal | Unos 45 días después del parto. |

### Muestra mínima para la evaluación de bienestar

| Cabras en la granja | Cabras a revisar una por una |
|---------------------|------------------------------|
| Hasta 10 | Todas |
| 11 a 50 | 10 |
| 51 a 100 | 20 |
| 101 a 500 | 35 |
| 501 a 1.000 | 45 |
| Más de 1.000 | El 4 % |

### Resultado de bienestar animal

| Clasificación | Puntaje |
|---------------|---------|
| Excelente | 90 % o más, con RSPP y ASI. |
| Alto | 75 % o más. |
| Medio | 50 % o más. |
| Bajo | Menos de 50 %. |

### Resultado de la clasificación lineal

| Categoría | Puntaje |
|-----------|---------|
| Excelente | 90 o más |
| Muy bueno | 85 a 89 |
| Bueno | 80 a 84 |
| Aceptable | 70 a 79 |
| Regular | 60 a 69 |
| Pobre | Menos de 60 |

### Valores de referencia de la leche

| Parámetro | Valor normal |
|-----------|--------------|
| Grasa | 3,0 a 5,0 % |
| Proteína | 2,8 a 3,8 % |
| Lactosa | 4,2 a 4,8 % |
| Temperatura | 2 a 6 °C |
| pH | 6,5 a 6,8 |
| Densidad | 1,028 a 1,034 g/ml |
| Células somáticas | Menos de 400.000 por ml |

---

*Capriva · Universidad Francisco de Paula Santander Ocaña · Versión 3.0 · Octubre de 2026*
