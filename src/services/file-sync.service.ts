import {Subject} from "rxjs/Subject";
import {Injectable} from "@angular/core";
import {WebSocketService} from "./web-socket.service";
import {TokenService} from "./token.service";
import {Observable} from "rxjs/Observable";
/**
 * Created by Joshua on 19.06.2017.
 */

/**
 * WebSocket-Handler for file synchronization events
 */
@Injectable()
export class FileSyncService {

  private $subject: Subject<number>;

  constructor(private webSocketService: WebSocketService, private tokenService: TokenService) {
    this.initializeSubscription();
  }

  private initializeSubscription() {
    this.$subject = new Subject();
    this.webSocketService.getClient().subscribe(stompClient => {
      stompClient.subscribe('/queue/filesync/' + this.tokenService.token,  (message) => {
        let fileChanges = JSON.parse(message.body);
        this.$subject.next(fileChanges);
      });
    });
  }


  public topicSubscribe(): Observable<number> {
    return this.$subject.asObservable();
  }

}
