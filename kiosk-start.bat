@echo off
REM Iniciar o servidor Nuxt em background
start /B pnpm preview

REM Aguardar o servidor iniciar
timeout /t 3 /nobreak >nul

REM Abrir Chrome em modo kiosk com impressão silenciosa
REM --kiosk-printing: suprime o dialogo de impressao (imprime direto para impressora padrao)
REM --kiosk: modo ecrã inteiro sem UI do browser
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --kiosk ^
  --kiosk-printing ^
  --disable-popup-blocking ^
  --no-first-run ^
  --disable-translate ^
  http://localhost:3000/painel
