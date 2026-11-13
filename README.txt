Boulder Escape - Videojuego 3D de persecución con Three.js

Juego para el examen T2 del curso Computación Gráfica y Visual.
Aquí, el personaje corre automaticamente por un camino mientras
una roca gigante le persigue y aparecen obstáculos que debe 
esquivar moviéndose de lado en lado.

Autor: Jeriko Aspajo Ugaz -  N00411297

1. Requisitos:
- Navegador con WEBGL habilitado.
- Python 3 (Windows o macOS) o extensión LIVESERVER de Visual Studio Code.
- Conexión a Internet: Three.js se importa desde jsDelivr (versión fija `0.180.0`).
- NO NECESITAS `npm install` ni instalar BLENDER para ejecutar este proyecto.

2. Ejecución paso a paso

a. Descomprime este RAR. No abras el archivo HTML dentro del RAR.
b. Abre una terminal dentro de la carpeta `T2_CGV_JerikoAspajo`.
c. Inicia un servidor HTTP local:

   Windows:
   ```powershell
   py -m http.server 8000
   ```

   macOS / Linux:
   ```bash
   python3 -m http.server 8000
   ```

d. En el navegador abre **http://localhost:8000/**.
e. Para la versión sencilla de la clase abre **http://localhost:8000/ejemplo_minimo.html**.
f. Para detener el servidor: `Ctrl+C` en la terminal.

Alternativa: instala la extensión *Live Server* en VS Code y selecciona **Open with Live Server** sobre `index.html`.

> IMPORTANTE: `file:///.../index.html` puede provocar errores de carga debido a las restricciones de seguridad del navegador. 
Los GLB deben servirse mediante HTTP.

3. Estructura
T2_CGV_JerikoAspajo/
├── index.html      ← página + mapa de importaciones (import map)
├── main.js         ← escena, personaje, roca, obstáculos y loop
├── README.md
├── textures/
│   └── piedra.jpg  ← textura de la roca

4. Controles
Mover al personaje a la izquierda -> Tecla A o flecha izquierda
Mover al personaje a la derecha -> Tecla D o flecha derecha

5. Errores Frecuentes
ERROR 1 - 
Pantalla vacía y error de CORS o file:// en consola
Se abrió "index.html" usando doble click
CORRECIÓN: Abrir con LIVESERVER.

ERROR 2 - 
404 Not Found para piedra.jpg
La textura no está en "textures" o cambio el nombre
CORRECCIÓN: Revisar código y confirmar que existe textures/piedra.jpg

Error 3 - 
Failed to remove module specifier "three"
Falta el <script type="importmap">
CORRECCIÓN: Mantener el import map en "index.html" antes de "main.js"

6. Video:
Este puede encontrarse en junto al RAR que se entregó en el examen dentro de la plataforma.

7. Documentación oficial:
Manual de Three.js: https://threejs.org/manual/pages/creating-a-scene.html
Texturas: https://threejs.org/manual/pages/textures.html
ConeGeometry: https://threejs.org/docs/pages/ConeGeometry.html
 
