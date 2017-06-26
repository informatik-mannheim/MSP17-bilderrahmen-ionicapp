import {FormControl} from "@angular/forms";

import {Observable} from "rxjs/Observable";
import {ReflectiveInjector} from "@angular/core";
import {
  BaseRequestOptions,
  BaseResponseOptions,
  BrowserXhr,
  ConnectionBackend,
  CookieXSRFStrategy,
  Http,
  RequestOptions,
  ResponseOptions,
  XHRBackend,
  XSRFStrategy
} from "@angular/http";


interface IUsernameEmailValidator {
}

function isReachable(control: FormControl, url: String): Observable<IUsernameEmailValidator> {
  let injector = ReflectiveInjector.resolveAndCreate([
    Http,
    BrowserXhr,
    {provide: RequestOptions, useClass: BaseRequestOptions},
    {provide: ResponseOptions, useClass: BaseResponseOptions},
    {provide: ConnectionBackend, useClass: XHRBackend},
    {provide: XSRFStrategy, useFactory: () => new CookieXSRFStrategy()},
  ]);
  let http = injector.get(Http);

  return new Observable((obs: any) => {
    control
      .valueChanges
      .debounceTime(300)
      .flatMap(value => http.get(control.value + "/websocket")).timeout(1500)
      .subscribe(
        data => {
          console.log("Connection found" + data);
          obs.next(null);
          obs.complete();
        },
        error => {
          console.log(error);
          let reason;
          console.error('Error', error);
          obs.next({[reason]: true});
          obs.complete();
        }
      );
  });
}


export class ServerIPValidator {

  constructor() {
  }

  static isReachable(control: FormControl) {
    return isReachable(control, 'url');
  }
}






