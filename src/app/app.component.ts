import {Component} from "@angular/core";
import {LoadingController, Platform} from "ionic-angular";
import {StatusBar} from "@ionic-native/status-bar";
import {SplashScreen} from "@ionic-native/splash-screen";
import {AuthenticationService} from "../services/authentication.service";
import {FileService} from "../services/file.service";
import {AndroidPermissions} from "@ionic-native/android-permissions";
import {Network} from "@ionic-native/network";
import {SlidesPage} from "../pages/slides/slides";
import {Observable} from "rxjs/Observable";
import {AndroidFullScreen} from "@ionic-native/android-full-screen";
import {Insomnia} from "@ionic-native/insomnia";

/**
 * Main component of the Bilderrahmen application
 * Initializes the application and loads all required components
 */
@Component({
  templateUrl: 'app.html'
})
export class Bilderrahmen {
  rootPage: any;

  constructor(private androidPermissions: AndroidPermissions,
              private splashScreen: SplashScreen,
              private network: Network,
              private loadingController: LoadingController,
              private platform: Platform,
              private statusBar: StatusBar,
              private authenticationService: AuthenticationService,
              private fileService: FileService,
              private insomnia: Insomnia,
              private fullscreen: AndroidFullScreen) {
    platform.ready().then(() => {
      this.startKioskMode();
      this.insomnia.keepAwake();
      statusBar.hide();
      this.initializeNetworkListener();
      if (this.network.type === 'none') {
        this.network.onConnect().take(1).subscribe(_ => {
          this.initializeApplicationData();
        });
      } else {
        this.initializeApplicationData();
      }
    });
  }

  private initializeApplicationData() {
    return this.authenticationService.authenticate().catch(error => {
      alert('Es wird ein gültiges Google-Konto benötigt.');
      this.initializeApplicationData();
      throw error;
    }).subscribe(ueer => {
      this.fileService.initialize().subscribe(res => {
        this.requestPermissionsAndLoadToken();
      });
    });
  }

  private requestPermissionsAndLoadToken() {
    Observable.forkJoin(
      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE),
      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.READ_EXTERNAL_STORAGE),
      (read, write) => {
        return {read, write};
      }
    ).flatMap(permissions => {
      if (!permissions.read.hasPermission || !permissions.write.hasPermission) {
        throw new Error('No Permissions');
      }
      return Observable.of(permissions);
    }).subscribe((permissions) => {
      this.fileService.synchronizeWithLoaderAnimation().finally(() => {
        this.rootPage = SlidesPage;
        this.splashScreen.hide();
      }).subscribe((img) => {
        console.log(img);
      }, (e) => {
        alert(e);
      });

    }, error => {
      console.log('schreibrechte anfragen', error);
      this.androidPermissions.requestPermissions([this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE, this.androidPermissions.PERMISSION.READ_EXTERNAL_STORAGE]).then(_ => {
        this.requestPermissionsAndLoadToken();
      })
    });
  }

  private initializeNetworkListener() {
    var loader;
    this.network.onDisconnect().debounceTime(500).subscribe(() => {
      console.debug('no internet connection');
      loader = this.loadingController.create({
        content: "Es wird eine stabile Internetverbindung benötigt...",
      });
      loader.present();
    });
    this.network.onConnect().subscribe(() => {
      console.debug('internet connection found');
      if (loader) {
        loader.dismissAll();
        this.loadingController.create({
          content: "Stabile Internetverbindung hergestellt!",
          duration: 1000
        }).present();
      }
    });
  }

  private startKioskMode() {
    this.fullscreen.isImmersiveModeSupported()
      .then(() => this.fullscreen.immersiveMode())
      .catch((error: any) => console.log(error));
  }

}
