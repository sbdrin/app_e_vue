'use strict'

import { app, protocol, BrowserWindow, globalShortcut } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'
const http = require('http');
const request = require('request');
const log = require('electron-log');
// const path = require('path')
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])
async function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 920,
    height: 680,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
    }
  })
  mainWindow.setMenu(null);
  globalShortcut.register('CommandOrControl+F12', () => {
    mainWindow.webContents.openDevTools()
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await mainWindow.loadURL(process.argv[2] || process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
  } else {
    createProtocol('app')
    // await mainWindow.loadURL(process.argv[1] || 'app://./index.html');
    await mainWindow.loadURL(process.argv[1] || 'http://dolphin-dev.kedacom.com/pmf2');
  }
}

function close() {
  request('http://localhost:9090/close', function (error, response, body) {
    log.info(JSON.stringify(response));
    app.quit();
  });
  setTimeout(() => { app.quit() }, 500);
}
// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    close()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
app.on('ready', async () => {
  createWindow();
  http.createServer(function (req, res) {
    if (req.url.indexOf('close')) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('app close');
      close();
    }
  }).listen(8888);
})
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        close();
      }
    })
  } else {
    process.on('SIGTERM', () => {
      close()
    })
  }
}
