'use strict'
// SAM Print Agent — run with: node print-agent.js
// Listens on http://127.0.0.1:9191 and prints ESC/POS bytes via Windows print spooler.
// Start automatically with the kiosk: add a shortcut to shell:startup or a scheduled task.

const http = require('http')
const { spawnSync } = require('child_process')
const { writeFileSync, unlinkSync } = require('fs')
const { join } = require('path')
const { tmpdir } = require('os')

const PORT = 9191

const PS_SCRIPT = `param([string]$Printer, [string]$DataFile)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrint {
    [DllImport("winspool.drv", CharSet=CharSet.Unicode, SetLastError=true)]
    public static extern bool OpenPrinter(string name, ref IntPtr h, IntPtr def);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool ClosePrinter(IntPtr h);
    [DllImport("winspool.drv", CharSet=CharSet.Unicode, SetLastError=true)]
    public static extern int StartDocPrinter(IntPtr h, int level, ref DocInfo info);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool EndDocPrinter(IntPtr h);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool StartPagePrinter(IntPtr h);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool EndPagePrinter(IntPtr h);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool WritePrinter(IntPtr h, IntPtr buf, int len, ref int written);
    [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
    public struct DocInfo {
        [MarshalAs(UnmanagedType.LPWStr)] public string DocName;
        [MarshalAs(UnmanagedType.LPWStr)] public string OutputFile;
        [MarshalAs(UnmanagedType.LPWStr)] public string Datatype;
    }
    public static void Send(string printer, byte[] data) {
        IntPtr h = IntPtr.Zero;
        if (!OpenPrinter(printer, ref h, IntPtr.Zero))
            throw new Exception("OpenPrinter failed: " + Marshal.GetLastWin32Error());
        var di = new DocInfo { DocName = "SAM Receipt", Datatype = "RAW" };
        int jobId = StartDocPrinter(h, 1, ref di);
        if (jobId == 0) { ClosePrinter(h); throw new Exception("StartDocPrinter failed: " + Marshal.GetLastWin32Error()); }
        StartPagePrinter(h);
        IntPtr p = Marshal.AllocHGlobal(data.Length);
        Marshal.Copy(data, 0, p, data.Length);
        int written = 0;
        bool ok = WritePrinter(h, p, data.Length, ref written);
        Marshal.FreeHGlobal(p);
        EndPagePrinter(h);
        EndDocPrinter(h);
        ClosePrinter(h);
        if (!ok) throw new Exception("WritePrinter failed: " + Marshal.GetLastWin32Error());
        if (written != data.Length) throw new Exception("WritePrinter wrote " + written + "/" + data.Length + " bytes");
    }
}
"@
try {
    $bytes = [System.IO.File]::ReadAllBytes($DataFile)
    [RawPrint]::Send($Printer, $bytes)
} catch {
    Write-Error $_
    exit 1
}
`

function getDefaultPrinter() {
  const r = spawnSync('powershell', [
    '-NoProfile', '-Command',
    'Get-WmiObject Win32_Printer -Filter "Default=True" | Select-Object -ExpandProperty Name'
  ], { encoding: 'utf8', timeout: 5000 })
  return (r.stdout || '').trim()
}

function listPrinters() {
  const r = spawnSync('powershell', [
    '-NoProfile', '-Command',
    'Get-WmiObject Win32_Printer | Select-Object -ExpandProperty Name'
  ], { encoding: 'utf8', timeout: 8000 })
  return (r.stdout || '').split('\n').map(p => p.trim()).filter(Boolean)
}

function sendRawToPrinter(data, printerName) {
  const name = (printerName || '').trim() || getDefaultPrinter()
  if (!name) throw new Error('No printer available')

  const id = Date.now()
  const dataFile = join(tmpdir(), `sam_receipt_${id}.bin`)
  const psFile = join(tmpdir(), `sam_print_${id}.ps1`)

  try {
    writeFileSync(dataFile, Buffer.from(data))
    writeFileSync(psFile, PS_SCRIPT, { encoding: 'utf8' })

    const r = spawnSync('powershell', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass',
      '-File', psFile,
      '-Printer', name,
      '-DataFile', dataFile
    ], { encoding: 'utf8', timeout: 20000 })

    const out = (r.stdout || '').trim()
    const err = (r.stderr || '').trim()
    if (r.error) throw r.error
    if (r.status !== 0) throw new Error(`PowerShell exited ${r.status}: ${err || out}`)
  } finally {
    try {
      unlinkSync(dataFile)
    } catch { /* ignore */ }
    try {
      unlinkSync(psFile)
    } catch { /* ignore */ }
  }
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { ok: true })
  }

  if (req.method === 'GET' && req.url === '/printers') {
    try {
      return json(res, 200, { printers: listPrinters() })
    } catch (e) {
      return json(res, 500, { error: e.message })
    }
  }

  if (req.method === 'POST' && req.url === '/print') {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        const { bytes, printerName } = JSON.parse(body)
        if (!Array.isArray(bytes)) throw new Error('bytes must be an array')
        sendRawToPrinter(bytes, printerName)
        return json(res, 200, { ok: true })
      } catch (e) {
        return json(res, 500, { error: e.message })
      }
    })
    return
  }

  res.writeHead(404)
  res.end()
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`SAM Print Agent a correr em http://127.0.0.1:${PORT}`)
  console.log('Ctrl+C para parar.')
})
