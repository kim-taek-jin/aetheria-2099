// Electron 메인 프로세스 — 빌드된 웹 앱(dist/)을 데스크톱 창으로 띄운다.
// 게임 코드는 src/ 단일 원본 그대로. 이 파일은 배포 껍데기일 뿐이라, 이후 게임을
// 고치면 `npm run build` 후 재패키징만 하면 된다.
const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#03070c', // 로딩 중 다크 배경(플래시 방지)
    title: 'AETHERIA 2099',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true, // 웹 앱은 node API가 필요 없음 — 안전 기본값
      nodeIntegration: false,
    },
  })

  // 외부 링크(있다면)는 시스템 브라우저로.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })

  // 개발 중엔 dev 서버, 배포 빌드에선 로컬 파일(file://).
  const devUrl = process.env.ELECTRON_DEV_URL
  if (devUrl) win.loadURL(devUrl)
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
