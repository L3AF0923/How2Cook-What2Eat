const { app, BrowserWindow, shell, screen } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const DISPLAY_NAME = 'How2Cook?&What2Eat?'
const INTERNAL_NAME = 'How2Cook-and-What2Eat'
const VERSION_LABEL = 'V0.3'
app.setName(INTERNAL_NAME)
app.setPath('userData', path.join(app.getPath('appData'), INTERNAL_NAME))
app.setAppUserModelId('com.how2cook.what2eat')

const logFile = path.join(app.getPath('userData'), 'desktop.log')
const log = (...values) => {
  const line = `[${new Date().toISOString()}] ${values.map((value) =>
    typeof value === 'string' ? value : JSON.stringify(value)
  ).join(' ')}\n`
  console.log('[How2Cook desktop]', ...values)
  try {
    fs.mkdirSync(path.dirname(logFile), { recursive: true })
    fs.appendFileSync(logFile, line)
  } catch {}
}
const isSafeExternalUrl = (value) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

const gotLock = app.requestSingleInstanceLock()
log('startup', { packaged: app.isPackaged, gotLock })
if (!gotLock) app.quit()

let mainWindow
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json')
const readWindowState = () => {
  try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')) } catch { return {} }
}
const saveWindowState = () => {
  if (!mainWindow || mainWindow.isDestroyed()) return
  try { fs.writeFileSync(stateFile(), JSON.stringify(mainWindow.getBounds())) } catch {}
}

function createWindow() {
  log('creating window')
  const saved = readWindowState()
  const savedBounds = Number.isFinite(saved.x) && Number.isFinite(saved.y)
    ? { x: saved.x, y: saved.y, width: saved.width || 1280, height: saved.height || 820 }
    : undefined
  const isVisible = savedBounds && screen.getAllDisplays().some(({ bounds }) =>
    savedBounds.x < bounds.x + bounds.width &&
    savedBounds.x + savedBounds.width > bounds.x &&
    savedBounds.y < bounds.y + bounds.height &&
    savedBounds.y + savedBounds.height > bounds.y
  )
  mainWindow = new BrowserWindow({
    title: `${DISPLAY_NAME} ${VERSION_LABEL}`,
    width: saved.width || 1280,
    height: saved.height || 820,
    x: isVisible ? saved.x : undefined,
    y: isVisible ? saved.y : undefined,
    minWidth: 900,
    minHeight: 640,
    show: true,
    backgroundColor: '#f6f1e7',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const current = mainWindow.webContents.getURL()
    if (url !== current && isSafeExternalUrl(url)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
  mainWindow.webContents.on('did-finish-load', () => log('renderer loaded', mainWindow.webContents.getURL()))
  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => log('renderer failed', { code, description, url }))
  mainWindow.webContents.on('render-process-gone', (_event, details) => log('renderer gone', details))
  mainWindow.on('closed', () => log('window closed'))
  mainWindow.on('close', saveWindowState)

  if (!app.isPackaged) mainWindow.loadURL('http://127.0.0.1:5173')
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.on('second-instance', () => {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.focus()
})

app.whenReady().then(() => {
  log('app ready')
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
}).catch((error) => log('app ready failed', { message: error.message, stack: error.stack }))
process.on('uncaughtException', (error) => log('uncaught exception', { message: error.message, stack: error.stack }))
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
