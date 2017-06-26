/**
 * Created by Joshua on 29.05.2017.
 */
import {Injectable} from "@angular/core";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {Observable} from "rxjs/Observable";
import * as Stomp from "stompjs";
import * as SockJS from "sockjs-client";

/**
 * Initializes the websocket stomp client to handle swipe, filesync and master-selection events
 */
@Injectable()
export class WebSocketService {

  private url: string;
  private readonly connectionRetryTime: number = 3000;
  private webSocket;
  private stompClient;

  private $stompClient = new ReplaySubject(1);

  constructor() {
  }

  public closeStompClient() {
    if (this.webSocket != null) {
      console.log("close " + this.webSocket.close());
      return this.webSocket.close();
    }
  }

  public initializeStompClient(url) {
    this.url = url;
    console.log("new URL" + url + '/websocket')
    this.webSocket = new SockJS(this.url.trim() + '/websocket');
    this.stompClient = Stomp.over(this.webSocket);
    //this.stompClient.debug = null;
    this.stompClient.connect({}, (frame) => {
      this.$stompClient.next(this.stompClient);
    }, error => {
      console.error(`stomp connection failed, trying again in ${this.connectionRetryTime}ms`, error);
      setTimeout(this.initializeStompClient(this.url), this.connectionRetryTime);
    });
  }

  public getClient(): Observable<any> {
    return this.$stompClient.asObservable();
  }
}
