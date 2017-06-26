import {Injectable} from "@angular/core";
import {WebSocketService} from "./web-socket.service";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {TokenService} from "./token.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Device} from "@ionic-native/device";
/**
 * Created by Marc on 16.06.2017.
 * WebSocket-Handler for file master-selection events
 */
@Injectable()
export class MasterSelectionService {

  public isMaster: BehaviorSubject<boolean>;
  private $subject: Subject<any>;

  constructor(private webSocketService: WebSocketService, private tokenService: TokenService, private device: Device) {
    this.isMaster = new BehaviorSubject(false);
    this.initializeSubscription();
  }

  private initializeSubscription() {
    this.$subject = new Subject();
    this.webSocketService.getClient().subscribe(stompClient => {
      stompClient.subscribe('/queue/master-selection/' + this.tokenService.token, (message) => {
        let masterSelection = JSON.parse(message.body);
        this.$subject.next(masterSelection.deviceId);
      });
    });
  }

  public masterSubscribe(): Observable<any> {
    return this.$subject.asObservable();
  }

  public masterSelection() {
    this.webSocketService.getClient().first().subscribe(stompClient => {
      stompClient.send("/bilderrahmen/master-selection/" + this.tokenService.token, {}, JSON.stringify({
        deviceId: this.device.uuid
      }));
    });
  }
}
