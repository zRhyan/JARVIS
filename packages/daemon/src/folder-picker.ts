// packages/daemon/src/folder-picker.ts

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * Invoca a caixa de diálogo nativa do sistema operacional para seleção de diretório/pasta.
 * Retorna o caminho absoluto selecionado ou null se o usuário cancelar.
 */
export async function pickFolderNative(): Promise<string | null> {
  const platform = process.platform;

  if (platform === 'linux') {
    // 1. Tenta Zenity (padrão em GNOME, Fedora, Ubuntu, Pop!_OS)
    try {
      const { stdout } = await execFileAsync('zenity', [
        '--file-selection',
        '--directory',
        '--title=Selecione a pasta do cofre Obsidian'
      ]);
      const picked = stdout.trim();
      return picked || null;
    } catch (err: any) {
      // Código de saída 1 indica que o usuário clicou em Cancelar ou fechou o diálogo
      if (err.code === 1) return null;
      // Se zenity não existir ou falhar por outro motivo, tenta kdialog
    }

    // 2. Tenta kdialog (KDE Plasma)
    try {
      const { stdout } = await execFileAsync('kdialog', [
        '--getexistingdirectory',
        process.env.HOME || '~',
        '--title',
        'Selecione a pasta do cofre Obsidian'
      ]);
      const picked = stdout.trim();
      return picked || null;
    } catch (err: any) {
      if (err.code === 1) return null;
    }
  } else if (platform === 'darwin') {
    // macOS AppleScript nativo
    try {
      const script = 'POSIX path of (choose folder with prompt "Selecione a pasta do cofre Obsidian")';
      const { stdout } = await execFileAsync('osascript', ['-e', script]);
      const picked = stdout.trim();
      // Remove barra final se houver (ex: /Users/nome/Cofre/ -> /Users/nome/Cofre)
      return picked ? picked.replace(/\/$/, '') : null;
    } catch {
      return null;
    }
  } else if (platform === 'win32') {
    // Windows PowerShell FolderBrowserDialog
    try {
      const psScript = `
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "Selecione a pasta do cofre Obsidian"
$dialog.ShowNewFolderButton = $false
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  Write-Output $dialog.SelectedPath
}
`;
      const { stdout } = await execFileAsync('powershell', ['-NoProfile', '-Command', psScript]);
      const picked = stdout.trim();
      return picked || null;
    } catch {
      return null;
    }
  }

  return null;
}
