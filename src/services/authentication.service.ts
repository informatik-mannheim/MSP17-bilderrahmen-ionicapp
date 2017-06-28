/**
 * Created by Joshua on 28.05.2017.
 */

import {Injectable} from "@angular/core";
import {GooglePlus} from "@ionic-native/google-plus";
import {User} from "../model/User";
import {Observable} from "rxjs/Observable";

/**
 * Handles OAuth authentication for google drive
 */
@Injectable()
export class AuthenticationService {

  public user: User;
  private readonly webClientId = '27747224096-on9fk0bunivi0pjsnf4tkhkjrnt4cgoi.apps.googleusercontent.com';
  private readonly scopes = 'profile https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata';
  private authenticationOptions;

  public constructor(private googlePlus: GooglePlus) {
    this.authenticationOptions = {
      'scopes': this.scopes,
      'webClientId': this.webClientId,
      'offline': true,
    };
  }

  public authenticate(): Observable<User> {
    return Observable.defer(() => this.googlePlus.login(this.authenticationOptions)).do(user => {
      this.user = user;
      this.keepAlive().subscribe((user) => {
        console.log('user token refreshed', user);
      });
    });
  }

  public authenticateSilent(): Observable<User> {
    return Observable.defer(() => this.googlePlus.trySilentLogin(this.authenticationOptions)).do(user => {
      console.log('silent login', user);
      this.user = user;
    });
  }

  public getAccessToken() {
    if (this.user) {
      return this.user.accessToken;
    }
    throw Error('Not authenticated yet');
  }

  // refresh token every 3605s
  private keepAlive(): Observable<User> {
    console.log('keeping authentication alive');
    return Observable.interval(600000).flatMap(() => {
      return this.authenticateSilent()
    });
  }

}
