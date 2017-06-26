import {Injectable} from "@angular/core";
import {WebSocketService} from "./web-socket.service";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {TokenService} from "./token.service";
/**
 * Created by Joshua on 29.05.2017.
 * WebSocket-Handler for image swipe events
 */

@Injectable()
export class SwipeService {

  private $subject: Subject<number>;

  constructor(private webSocketService: WebSocketService, private tokenService: TokenService) {
    this.initializeSubscription();
  }

  private initializeSubscription() {
    this.$subject = new Subject();
    this.webSocketService.getClient().subscribe(stompClient => {
      stompClient.subscribe('/queue/swipe/' + this.tokenService.token, (message) => {
        let swipe = JSON.parse(message.body);
        this.$subject.next(swipe.id);
      });
    });
  }

  public topicSubscribe(): Observable<number> {
    return this.$subject.asObservable();
  }

  public swipe(imageId: number) {
    this.webSocketService.getClient().first().subscribe(stompClient => {
      stompClient.send("/bilderrahmen/swipe/" + this.tokenService.token, {}, JSON.stringify({
        id: imageId
      }));
    });

  }
}
