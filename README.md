# MSP17-bilderrahmen-ionicapp

## General
This repository is part of the ['Ich-Zeig-Dir-Was'-Bilderrahmen project](https://github.com/informatik-mannheim/bilderrahmen-msp17). The bilderrahmen-ionic application is built with the open source framework [ionic](http://ionicframework.com/) to provide a cross-platform application.

To communicate with the synchronization server [STOMP.js](https://github.com/jmesnil/stomp-websocket) and [SockJS](https://github.com/sockjs/sockjs-client) are used.


## First steps
After installing the application on a device, you first have to authenticate with a valid Google account to save all uploaded images in your own Google Drive folder.
To save images on the device you also have to grant permissions on the first startup.


## Deployment
To deploy the application on a device NodeJS is required which can be downloaded for different platforms [here](https://nodejs.org/en/).

Additionally the *cordova-cli* and *ionic-cli* and all required dependencies have to be installed with the following commands

```bash
$ sudo npm install -g ionic cordova
$ npm install
```

Depending on the target platform there are other setup steps necessary to deploy the application: [Android](https://cordova.apache.org/docs/en/latest/guide/platforms/android), [iOS](https://cordova.apache.org/docs/en/latest/guide/platforms/ios)


To start the application for the first time the target platform has to be added with either

```bash
$ ionic cordova platform add android
``` 

or

```bash
$ ionic cordova platform add ios
```

To change the default value for the server's address in the settings, change [this line](https://github.com/informatik-mannheim/MSP17-bilderrahmen-ionicapp/blob/master/src/pages/settings/settings.ts#L27).

After completing the preceding steps successfully the application can be deployed on a device with:

```bash
$ ionic cordova build android && cordova run android --device
```

## Troubleshooting

### Error: Your android platform does not have Api.js

If you get this error you should update your NodeJS installation and execute the following two commands:

```bash
ionic cordova remove android
ionic cordova add android
```

