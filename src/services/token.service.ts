/**
 * Created by Joshua on 16.06.2017.
 */
import {Injectable} from "@angular/core";
import {GDriveHttpService} from "./gdrive-http.service";
import {Http, RequestOptions, URLSearchParams} from "@angular/http";
import {File} from "@ionic-native/file";
import {AuthenticationService} from "./authentication.service";
import {Observable} from "rxjs/Observable";

/**
 * Handles all required methods to initialize and download the token to communicate with the synchronization server
 */
@Injectable()
export class TokenService {


  public url: string;
  private _token: string;

  public get token() {
    return this._token;
  }

  constructor(private gDriveHttpService: GDriveHttpService,
              private file: File,
              private http: Http,
              private authenticationService: AuthenticationService,) {
  }

  public loadToken(): Observable<any> {
    return this.getTokenFromGoogleDrive().switchMap(res => {
      console.debug('token from google', res);
      if (res.files.length <= 0) {
        return this.generateAndUploadNewToken();
      } else {
        let token = res.files[0].appProperties.tokenValue;
        console.debug('returning existing token', token);
        return Observable.of(token);
      }
    }).do(token => {
      console.log('returned token ', token);
      this._token = token;
    });
  }

  private getTokenFromGoogleDrive() {
    let params = new URLSearchParams();
    params.set('spaces', 'appDataFolder');
    params.set('fields', 'files(name, appProperties)');
    params.set('q', 'appProperties has { key="token" and value="true" }');
    let options = new RequestOptions({
      search: params
    });
    console.debug('generating new token');
    return this.gDriveHttpService.get('https://content.googleapis.com/drive/v3/files', options).map(res => res.json());
  }


  private generateAndUploadNewToken() {
    var token = '';
    return this.generateNewToken().switchMap(res => {
      console.log('new token from syncserver', res);
      token = res.id;
      return this.uploadTokenToGoogleDrive(token);
    }).map(res => {
      return token;
    });
  }

  private generateNewToken() {
    console.log("resturk" + this.url);
    return this.http.post(this.url + "/token", this.authenticationService.user.email).map(res => res.json());
  }

  private uploadTokenToGoogleDrive(token: string) {
    if(!token) {
      throw new Error('invalid token');
    }
    let metadata = {
      appProperties: {
        token: true,
        tokenValue: token
      },
      name: 'key.priv',
      parents: [
        "appDataFolder"
      ]
    };

    var formData: FormData = new FormData();
    var blob = new Blob([token], {type: "text/plain"});

    formData.append("metadata", new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
    formData.append("file", blob);

    return this.gDriveHttpService.post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', formData).retry(2);
  }


}
