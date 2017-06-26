import {Component, ViewChild} from "@angular/core";
import {Content, ModalController, NavController, NavParams, Slides, ToastController} from "ionic-angular";
import {FileService} from "../../services/file.service";
import {SwipeService} from "../../services/swipe.service";
import {Storage} from "@ionic/storage";
import {MasterSelectionService} from "../../services/master-selection.service";
import {HomePage} from "../home/home";
import {FileSyncService} from "../../services/file-sync.service";
import {SettingsModal} from "../settings/settings";
import {WebSocketService} from "../../services/web-socket.service";
import {TokenService} from "../../services/token.service";
import {Device} from "@ionic-native/device";

@Component({
  selector: 'page-slides',
  templateUrl: 'slides.html'
})
export class SlidesPage {

  buttonIcon: string = "lock";
  public images;
  public initialized = false;
  private description;

  @ViewChild(Slides) slides: Slides;

  @ViewChild(Content) content: Content;

  constructor(public navCtrl: NavController,
              private fileService: FileService,
              private navParams: NavParams,
              private swipeService: SwipeService,
              private storage: Storage,
              private masterSelectionService: MasterSelectionService,
              private toastController: ToastController,
              private fileSyncService: FileSyncService,
              public modalCtrl: ModalController,
              public webSocketService: WebSocketService,
              private device: Device,
              public tokenService: TokenService) {

  }

  ionViewWillEnter() {
    this.showSettingsIfNotSet();
    this.reloadFiles();
  }

  ionViewDidEnter() {
    this.initialize();
    this.initializeMasterSubscription();
    this.initializeFileSyncSubscription();
  }

  private reloadFiles(showLatest?: boolean) {
    this.fileService.getFiles().then(
      (files) => {
        this.images = files.sort((a, b) => {
          if (a.name.split('_')[0] < b.name.split('_')[0]) return -1;
          if (a.name.split('_')[0] > b.name.split('_')[0]) return 1;
          return 0;
        }).filter(file => file.isFile === true);
        this.clearDescriptionIfNoImagesAvailable();
        if (showLatest && this.images && this.images.length > 0) {
          setTimeout(() => {
            this.showNewImagesToast();
            this.slideTo(this.images.length - 1);
          }, 5000)
        }
      }
    );
  }

  private clearDescriptionIfNoImagesAvailable() {
    if (!this.images || this.images.length <= 0) {
      this.description = '';
    }
  }

  private slideTo(index, delay?: number) {
    if (this.images && this.images[index]) {
      this.slides.lockSwipes(false);

      this.slides.slideTo(index, delay ? delay : 0);

      this.loadDescriptionForImageName(this.images[index].name);

      if (!this.masterSelectionService.isMaster.value) {
        this.slides.lockSwipes(true);
      }
    }
  }

  private reloadFilesAndShowLatest() {
    this.reloadFiles(true);
  }

  private initializeMasterSubscription() {
    this.masterSelectionService.isMaster.subscribe(isMaster => {
      this.setMasterPrivileges(isMaster);
    });
    this.masterSelectionService.masterSubscribe().takeUntil(this.navCtrl.viewWillLeave).subscribe(selection => {
      console.log('MASTER', selection);
      if (selection === this.device.uuid) {
        this.masterSelectionService.isMaster.next(true);
      }
      else {
        this.masterSelectionService.isMaster.next(false);
      }
    });
  }

  private initializeFileSyncSubscription() {
    this.fileSyncService.topicSubscribe().takeUntil(this.navCtrl.viewWillLeave).switchMap(res => {
      return this.fileService.synchronize().finally(() => {
        this.reloadFilesAndShowLatest();
      });
    }).subscribe();
  }

  private showNewImagesToast() {
    this.toastController.create({
      message: 'Bilder wurden synchronisiert',
      duration: 6000,
      position: 'top'
    }).present();
  }

  private loadDescriptionForIndex(index: number) {
    if (this.images && this.images[index]) {
      this.loadDescriptionForImageName(this.images[index].name);
    }
  }

  private loadDescriptionForImageName(imageName: string) {
    return this.storage.get('DESC_' + imageName).then(description => {
      this.description = description;
    });
  }


  private setMasterPrivileges(isMaster) {
    console.debug('set master privileges', isMaster);
    this.slides.lockSwipes(!isMaster);
    if (isMaster) {
      this.buttonIcon = "unlock";
    }
    else {
      this.buttonIcon = "lock";
    }
  }

  initialize() {
    this.slides.ionSlideDidChange.takeUntil(this.navCtrl.viewWillLeave).subscribe(slides => {
      if (this.images && this.images[slides.realIndex]) {
        let imageName = this.images[slides.realIndex].name;
        let imageID = imageName.split('_')[1];
        if (this.masterSelectionService.isMaster.value) {
          this.swipeService.swipe(imageID);
        }
        this.loadDescriptionForImageName(imageName);
      }
    });
    let slide = parseInt(this.navParams.get('slide'));
    this.slideTo(slide);
    this.initialized = true;
    this.swipeService.topicSubscribe().filter(() => !this.masterSelectionService.isMaster.value).takeUntil(this.navCtrl.viewWillLeave).subscribe(slide => {
      console.log('SLIDED', slide);
      this.slideToImageWithId(slide);
    });
  }

  private slideToImageWithId(id) {
    let counter = 0;
    for (let image of this.images) {
      if (image.name.includes(id)) {
        console.log("found" + id);
        this.slideTo(counter, 300);
        return;
      }
      counter++;
    }
  }

  masterButtonClicked() {
    console.log("button clicked");
    this.masterSelectionService.masterSelection();
  }

  galleryButtonClicked() {
    this.navCtrl.push(HomePage);
  }

  settingsButtonClicked() {
    let modal = this.modalCtrl.create(SettingsModal);
    modal.present();
  }


  private showSettingsIfNotSet() {
    this.storage.get("ServerIp").then(serverip => {
      if (serverip == null) {
        this.settingsButtonClicked();
      }
      else {
        this.tokenService.url = serverip;
        if (!this.tokenService.token) {
          this.tokenService.loadToken().first().retry(2).subscribe(token => {
            console.log('MyNew Token', token);
            this.loadDescriptionForIndex(0)
            this.webSocketService.initializeStompClient(serverip);
          });
        }
      }
    })
  }
}

