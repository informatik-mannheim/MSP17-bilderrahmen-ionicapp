import {Injectable} from "@angular/core";
import "rxjs/Rx";
import "rxjs/add/operator/map";
import {Entry, File} from "@ionic-native/file";
import {GDriveHttpService} from "./gdrive-http.service";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Storage} from "@ionic/storage";
import {Loading, LoadingController} from "ionic-angular";
import {RequestOptions, URLSearchParams} from "@angular/http";
import {ErrorObservable} from "rxjs/observable/ErrorObservable";

/**
 * Synchronizes all files from google drive to delete old images
 * and save new images with their thumbnail
 */
@Injectable()
export class FileService {

  public readonly filePath = "images";

  constructor(private file: File, private gDriveHttpService: GDriveHttpService, private storage: Storage, private loadingController: LoadingController) {
  }

  public initialize(): Observable<boolean> {
    return this.createFoldersIfNotExist();
  }

  private createFoldersIfNotExist(): Observable<boolean> {
    let $subject: Subject<boolean> = new Subject();
    this.file.checkDir(this.file.dataDirectory, this.filePath).then(exists => {
      console.debug('folder exists');
      $subject.next(true);
    }).catch(() => {
      this.file.createDir(this.file.dataDirectory, this.filePath, false).then(_ => {
        console.debug('created folder');
        return this.file.createDir(this.file.dataDirectory, this.filePath + '/thumbnails', false)
      }).then(_ => {
        console.debug('created thumbnail folder');
        $subject.next(true);
      }).catch(error => {
        console.error(error);
        $subject.next(false);
        alert('could not create folders');
      })
    });
    return $subject.asObservable().take(1);
  }

  public downloadNewFiles(): Observable<any> {
    return this.getFilesFromDrive().switchMap((data): Observable<any> => {
      return Observable.from(data.files);
    }).filter(currentFile => typeof currentFile.thumbnailLink !== 'undefined')
      .mergeMap(currentFile => {
        let createdTime = new Date(currentFile.createdTime).getTime();
        let filename = createdTime + "_" + currentFile.id + "_" + currentFile.name;
        let downloadObservable = this.downloadImageAndThumbnail(filename, currentFile);
        if (currentFile.description) {
          downloadObservable.merge(this.storage.set('DESC_' + filename, currentFile.description));
        }
        return downloadObservable;
      }, null, 5).filter(res => typeof(res) !== 'boolean');
  }

  private downloadImageAndThumbnail(filename: string, gDriveFile) {
    return this.imageExists(filename).switchMap(result => {
      if (result instanceof ErrorObservable) {
        return this.gDriveHttpService.downloadByFileId(gDriveFile.id, this.file.dataDirectory + this.filePath + "/" + filename).retryWhen(attempts => {
          return attempts.scan((count, error) => {
            console.error(`failed to download file ${filename} retry number ${count}`, error);
            if (count >= 10) {
              throw error;
            }
            return count + 1;
          }, 0).delay(1000);
        });
      }
      return Observable.empty();
    }).concat(this.thumbnailExists(filename).switchMap(result => {
      if (result instanceof ErrorObservable) {
        return this.gDriveHttpService.download(gDriveFile.thumbnailLink, this.file.dataDirectory + this.filePath + "/thumbnails/" + filename).retryWhen(attempts => {
          return attempts.scan((count, error) => {
            console.error(`failed to download file-thumbnail ${filename} retry number ${count}`, error);
            if (count >= 10) {
              throw error;
            }
            return count + 1;
          }, 0).delay(1000);
        });
      }
      return Observable.empty();
    }))
  }

  private imageExists(filename: string) {
    return Observable.fromPromise(this.file.checkFile(this.file.dataDirectory + this.filePath + "/", filename).catch(e => Observable.throw(new Error(e))));
  }

  private thumbnailExists(filename: string) {
    return Observable.fromPromise(this.file.checkFile(this.file.dataDirectory + this.filePath + "/thumbnails/", filename).catch(e => Observable.throw(new Error(e))));
  }

  public deleteOldFiles(): Observable<any> {
    return Observable.zip(this.getFilesFromDrive(), this.getFiles(), (gdriveFiles, localFiles) => {
      return {gdriveFiles: gdriveFiles.files, localFiles};
    }).flatMap(files => {
      let deletions = [];
      files.localFiles.forEach(localFile => {
        let found = false;
        if (localFile.isFile) {
          files.gdriveFiles.forEach(gdriveFile => {
            let createdTime = new Date(gdriveFile.createdTime).getTime();
            let filename = createdTime + "_" + gdriveFile.id + "_" + gdriveFile.name;
            if (localFile.name === filename) {
              found = true;
            }
          });
          if (!found) {
            deletions.push(this.deleteLocalFile(localFile));
          }
        }
      });
      return Observable.from(deletions).concatAll();
    });
  }

  public synchronize(): Observable<any> {
    return this.downloadNewFiles().concat(this.deleteOldFiles());
  }

  public synchronizeWithLoaderAnimation(): Observable<any> {
    let loading: Loading = this.loadingController.create();
    let spinnerPresented = false;
    let downloadCounter = 0;
    let deletionCounter = 0;
    return this.synchronize().do(result => {
      if (!spinnerPresented) {
        loading.present();
      }
      if (result.isFile) {
        loading.setContent('Lade neue Bilder herunter: ' + Math.ceil((++downloadCounter / 2)));
      } else if (result.fileRemoved) {
        loading.setContent('Entferne alte Bilder:' + Math.ceil((++deletionCounter / 2)));
      }
    }, (e) => {
      console.error(e);
    }, () => {
      console.debug('completed synchronizing');
    }).finally(() => {
      loading.dismissAll();
    });
  }

  getFiles() {
    return this.file.listDir(this.file.dataDirectory, this.filePath);
  }

  getFilesThumbnails() {
    return this.file.listDir(this.file.dataDirectory, this.filePath + "/thumbnails");
  }

  deleteLocalFile(file: Entry) {
    this.storage.remove('DESC_' + file.name);
    return Observable.fromPromise(this.file.removeFile(this.file.dataDirectory + '/' + this.filePath, file.name))
      .concat(Observable.fromPromise(this.file.removeFile(this.file.dataDirectory + '/' + this.filePath + '/thumbnails', file.name)));
  }

  private getFilesFromDrive() {
    let params = new URLSearchParams();
    params.set('q', 'appProperties has { key="bilderrahmen" and value="true" } and mimeType contains "image" and trashed=false');
    params.set('fields', 'files(createdTime,id,name,description,webContentLink,thumbnailLink)');
    let options = new RequestOptions({
      search: params
    });
    return this.gDriveHttpService.get('https://content.googleapis.com/drive/v3/files', options)
      .map(value => value.json());

  }
}
