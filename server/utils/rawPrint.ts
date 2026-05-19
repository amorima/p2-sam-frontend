import { spawnSync } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// $ErrorActionPreference = 'Stop' makes all PowerShell errors terminating (exit 1)
const PS_SCRIPT = String.raw`
param([string]$Printer, [string]$DataFile)
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
`.trimStart()

function getDefaultPrinter(): string {
  const r = spawnSync('powershell', [
    '-NoProfile',
    '-Command',
    'Get-WmiObject Win32_Printer -Filter "Default=True" | Select-Object -ExpandProperty Name'
  ], { encoding: 'utf8', timeout: 5000 })
  return r.stdout?.trim() ?? ''
}

export function sendRawToPrinter(data: Buffer, printerName?: string): void {
  const name = printerName?.trim() || getDefaultPrinter()
  if (!name) throw new Error('No printer name available')

  const id = Date.now()
  const dataFile = join(tmpdir(), `sam_receipt_${id}.bin`)
  const psFile = join(tmpdir(), `sam_print_${id}.ps1`)

  try {
    writeFileSync(dataFile, data)
    // BOM-less UTF-8 so PowerShell reads the param block correctly
    writeFileSync(psFile, PS_SCRIPT, { encoding: 'utf8' })

    const r = spawnSync('powershell', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', psFile,
      '-Printer', name,
      '-DataFile', dataFile
    ], { encoding: 'utf8', timeout: 20000 })

    const out = (r.stdout ?? '').trim()
    const err = (r.stderr ?? '').trim()

    if (r.error) throw r.error
    if (r.status !== 0) throw new Error(`PowerShell exited ${r.status}: ${err || out}`)
  }
  finally {
    try { unlinkSync(dataFile) } catch {}
    try { unlinkSync(psFile) } catch {}
  }
}
