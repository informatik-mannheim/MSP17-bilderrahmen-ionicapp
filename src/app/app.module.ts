import {HttpModule, RequestOptions, XHRBackend} from "@angular/http";
import {ErrorHandler, NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {IonicApp, IonicErrorHandler, IonicModule} from "ionic-angular";
import {Bilderrahmen} from "./app.component";


import {HomePage} from "../pages/home/home";

import {StatusBar} from "@ionic-native/status-bar";
import {SplashScreen} from "@ionic-native/splash-screen";

import {Transfer} from "@ionic-native/transfer";
import {File} from "@ionic-native/file";
import {GDriveHttpService} from "../services/gdrive-http.service";
import {FileService} from "../services/file.service";
import {SlidesPage} from "../pages/slides/slides";
import {AuthenticationService} from "../services/authentication.service";
import {GooglePlus} from "@ionic-native/google-plus";
import {AndroidFullScreen} from "@ionic-native/android-full-screen";
import {WebSocketService} from "../services/web-socket.service";
import {SwipeService} from "../services/swipe.service";
import {IonicStorageModule} from "@ionic/storage";
import {AndroidPermissions} from "@ionic-native/android-permissions";
import {TokenService} from "../services/token.service";
import {MasterSelectionService} from "../services/master-selection.service";
import {Network} from "@ionic-native/network";
import {FileSyncService} from "../services/file-sync.service";
import {Autostart} from "@ionic-native/autostart";
import {SettingsModal} from "../pages/settings/settings";
import {Insomnia} from "@ionic-native/insomnia";
import {Device} from "@ionic-native/device";

/**
 * Bilderrahmen-Modul
 */
@NgModule({
  declarations: [
    Bilderrahmen,
    HomePage,
    SlidesPage,
    SettingsModal,
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(Bilderrahmen, {
      syncServerUrl: 'https://141.19.142.6:8443'
    }),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    Bilderrahmen,
    HomePage,
    SlidesPage,
    SettingsModal
  ],
  providers: [
    Network,
    StatusBar,
    SplashScreen,
    Transfer,
    File,
    GooglePlus,
    FileService,
    AndroidFullScreen,
    AuthenticationService,
    WebSocketService,
    SwipeService,
    FileSyncService,
    MasterSelectionService,
    AndroidPermissions,
    TokenService,
    Autostart,
    Device,
    Insomnia,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    {
      provide: GDriveHttpService,
      useClass: GDriveHttpService,
      deps: [XHRBackend, RequestOptions, AuthenticationService, Transfer]
    }
  ]
})
export class AppModule {
}
