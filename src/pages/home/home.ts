import {Component} from "@angular/core";
import {Loading, LoadingController, NavController} from "ionic-angular";
import {FileService} from "../../services/file.service";
import {SlidesPage} from "../slides/slides";
import {MasterSelectionService} from "../../services/master-selection.service";
import {FileSyncService} from "../../services/file-sync.service";
import {Device} from "@ionic-native/device";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  public images;

  constructor(private navCtrl: NavController,
              private fileService: FileService,
              private loadingCtrl: LoadingController,
              private fileSyncService: FileSyncService,
              private device: Device,
              private masterSelectionService: MasterSelectionService) {
  }

  ionViewWillEnter() {
    if (!this.masterSelectionService.isMaster.value) {
      this.navCtrl.push(SlidesPage);
    } else {
      this.reloadFiles();
      this.initializeFileSyncSubscription();
      this.initializeMasterSubscription();
    }
  }

  reloadFiles() {
    let loading: Loading = this.loadingCtrl.create({
      content: 'Lade Bilder...'
    });

    loading.present();
    this.fileService.getFilesThumbnails().then(
      files => {
        this.images = files.sort(function (a, b) {
          if (a.name.split('_')[0] < b.name.split('_')[0]) return -1;
          if (a.name.split('_')[0] > b.name.split('_')[0]) return 1;
          return 0;
        }).filter(file => file.isFile === true);
        loading.dismissAll();
      });
  }

  private initializeFileSyncSubscription() {
    this.fileSyncService.topicSubscribe().takeUntil(this.navCtrl.viewWillLeave).switchMap(res => {
      return this.fileService.synchronize().finally(() => {
        this.reloadFiles();
      });
    }).subscribe();
  }

  private initializeMasterSubscription() {
    this.masterSelectionService.masterSubscribe().takeUntil(this.navCtrl.viewWillLeave).subscribe(selection => {
      if (selection === this.device.uuid) {
        this.masterSelectionService.isMaster.next(true);
      }
      else {
        this.masterSelectionService.isMaster.next(false);
        this.navCtrl.push(SlidesPage);
      }
    });
  }

  showSlide(index) {
    this.navCtrl.push(SlidesPage, {
      slide: index
    });
  }
}

