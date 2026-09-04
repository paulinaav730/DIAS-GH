# 🚀 Guía Definitiva de Despliegue en Firebase Hosting - Proyecto DÍAS

Esta guía está diseñada para que cualquier persona, desde cero, pueda descargar la aplicación y subirla a producción en **Firebase Hosting**. 
Al finalizar, la aplicación tendrá una URL pública (ej. `proyecto-dias.web.app`) y estará conectada a la base de datos oficial.

---

## Paso 0: Preparación del Entorno (Instalaciones necesarias)

Antes de tocar código, asegúrate de tener instaladas las siguientes herramientas base en tu computador. **Si ya las tienes, puedes saltar al Paso 1.**

1. **Instalar Node.js y NPM:**
   - Ve a [nodejs.org](https://nodejs.org/) y descarga el instalador (Recomendado: versión LTS).
   - Ejecuta el instalador y dale "Siguiente" a todo hasta finalizar.
   - *Para comprobar que se instaló, abre una terminal y escribe: `node -v` y `npm -v`. Deberían salirte números de versión.*

2. **Instalar Git:**
   - Ve a [git-scm.com](https://git-scm.com/downloads) y descarga el instalador para tu sistema operativo.
   - *Para comprobar que se instaló, escribe en la terminal: `git -v`.*

---

## Paso 1: Descargar el código y configurar el proyecto

Abre tu **Consola / Terminal** (Símbolo del sistema, PowerShell o Terminal en Mac) y ejecuta los siguientes comandos uno por uno:

1. **Descargar el código de GitHub:**
   Reemplaza la URL por la URL real de tu repositorio.
   ```bash
   git clone https://github.com/tu-usuario/dias-gh.git
   ```

2. **Entrar a la carpeta del proyecto:**
   ```bash
   cd dias-gh
   ```

3. **Instalar todas las dependencias del proyecto:**
   Esto descargará las librerías necesarias para que la app funcione.
   ```bash
   npm install
   ```

4. **Instalar las herramientas de Firebase globales en tu PC:**
   ```bash
   npm install -g firebase-tools
   ```
   *(Nota para usuarios de Mac/Linux: Si el comando anterior te arroja un error de permisos, escribe `sudo npm install -g firebase-tools` e ingresa la contraseña de tu usuario).*

---

## Paso 2: Autenticación y Conexión con Firebase

Ahora debes conectarte a la cuenta de Firebase que administra la base de datos.

1. **Iniciar sesión en Firebase:**
   ```bash
   firebase login
   ```
   *Esto abrirá una pestaña en tu navegador web. Inicia sesión con la cuenta de Google autorizada. Cuando la página diga "Success", vuelve a la terminal.*

2. **Inicializar Firebase en la carpeta del proyecto:**
   ```bash
   firebase init hosting
   ```

3. **Responde exactamente esto a las preguntas de la consola:**
   - *Are you ready to proceed?* 👉 Escribe **Y** y presiona Enter.
   - *Please select an option:* 👉 Usa las flechas del teclado, selecciona **Use an existing project** y presiona Enter.
   - *Select a default Firebase project:* 👉 Busca en la lista el nombre de tu proyecto (DÍAS) y presiona Enter.
   - *What do you want to use as your public directory?* 👉 Escribe **dist** y presiona Enter. *(¡Muy importante!)*
   - *Configure as a single-page app?* 👉 Escribe **y** y presiona Enter.
   - *Set up automatic builds and deploys with GitHub?* 👉 Escribe **n** y presiona Enter.
   - *File dist/index.html already exists. Overwrite?* (Solo si sale) 👉 Escribe **N** y presiona Enter.

---

## Paso 3: Compilar y Subir a Producción

La configuración está lista. Solo falta empaquetar la app y subirla.

1. **Construir (empaquetar) la aplicación:**
   ```bash
   npm run build
   ```
   *Espera unos segundos. Cuando termine, dirá "built in X.XXs".*

2. **Subir a los servidores de Firebase Hosting:**
   ```bash
   firebase deploy --only hosting
   ```

🎉 **¡Despliegue Exitoso!**
Al terminar, verás un texto verde en la terminal que dice **"Deploy complete!"** y te entregará la **Hosting URL** (ej. `https://tu-proyecto.web.app`). Ese link es la aplicación en vivo que puedes compartir con el equipo.

---

## 🔁 ¿Cómo subir una actualización en el futuro?

Si alguien cambia algo del código o agrega una nueva función en el futuro, no tienes que repetir todo el proceso. Simplemente abre la terminal en la carpeta del proyecto y ejecuta estos comandos:

```bash
git pull origin main
npm run build
firebase deploy --only hosting
```
