/**
 * Created by Joshua on 27.05.2017.
 */

import {Injectable} from "@angular/core";
import {ConnectionBackend, Headers, Http, Request, RequestOptions, RequestOptionsArgs, Response} from "@angular/http";
import {Observable} from "rxjs/Observable";
import {AuthenticationService} from "./authentication.service";
import {Transfer, TransferObject} from "@ionic-native/transfer";

/**
 * HttpService for GoogleDrive to send the required access_token with each request
 * Additionally utility methods are provided to download and upload files
 */
@Injectable()
export class GDriveHttpService extends Http {

  constructor(backend: ConnectionBackend, defaultOptions: RequestOptions, private authenticationService: AuthenticationService, private transfer: Transfer) {
    super(backend, defaultOptions);
  }

  request(url: string | Request, options?: RequestOptionsArgs): Observable<Response> {
    return this.intercept(super.request(url, this.addHeaders(options)));
  }

  get(url: string, options?: RequestOptionsArgs): Observable<Response> {
    return this.intercept(super.get(url, this.addHeaders(options)));
  }

  post(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
    return this.intercept(super.post(url, body, this.addHeaders(options)));
  }

  put(url: string, body: string, options?: RequestOptionsArgs): Observable<Response> {
    return this.intercept(super.put(url, body, this.addHeaders(options)));
  }

  delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
    return this.intercept(super.delete(url, options));
  }

  downloadByFileId(fileId: string, target: string) {
    const fileTransfer: TransferObject = this.transfer.create();
    var options = {
      headers: {
        'Authorization': 'Bearer ' + this.authenticationService.getAccessToken()
      }
    }
    return Observable.defer(() =>  fileTransfer.download("https://www.googleapis.com/drive/v3/files/" + fileId + "?alt=media", target, false, options));
  }

  download(url: string, target: string) {
    const fileTransfer: TransferObject = this.transfer.create();
    var options = {
      headers: {
        'Authorization': 'Bearer ' + this.authenticationService.getAccessToken()
      }
    }
    return Observable.defer(() => fileTransfer.download(url, target, false, options));
  }

  addHeaders(options?: RequestOptionsArgs): RequestOptionsArgs {
    if (options == null) {
      options = new RequestOptions();
    }
    if (options.headers == null) {
      options.headers = new Headers();
    }
    options.headers.append('Authorization', 'Bearer ' + this.authenticationService.getAccessToken());
    return options;
  }

  intercept(observable: Observable<Response>): Observable<Response> {
    return observable.catch((err, source) => {
      if (err.status == 401) {
        this.authenticationService.authenticateSilent();
        return Observable.empty();
      } else {
        return Observable.throw(err);
      }
    });

  }
}
