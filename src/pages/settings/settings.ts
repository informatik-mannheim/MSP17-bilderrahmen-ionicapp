/**
 * Created by Alex on 20.06.2017.
 */

import {NavParams, Platform, ViewController} from "ionic-angular";
import {Component} from "@angular/core";
import {Storage} from "@ionic/storage";
import {Autostart} from "@ionic-native/autostart";
import {Device} from "@ionic-native/device";
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {WebSocketService} from "../../services/web-socket.service";
import {MasterSelectionService} from "../../services/master-selection.service";
import {ServerIPValidator} from "../settings/serverIP";
import {TokenService} from "../../services/token.service";


@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsModal {

  public toggleStatus;


  public ServerIp: AbstractControl;
  private readonly defaultServer = 'https://example.com:8443';
  regForm: FormGroup;

  constructor(public platform: Platform,
              public params: NavParams,
              public viewCtrl: ViewController,
              private storage: Storage,
              private autostart: Autostart,
              public fb: FormBuilder,
              public webSocketService: WebSocketService,
              public masterSelectionService: MasterSelectionService,
              public device: Device,
              public tokenService: TokenService) {

    this.regForm = this.fb.group({
      ServerIp: ['', Validators.compose([Validators.required, Validators.pattern("^(https?):\/\/[^\s/$.?#].[^\s]*")]), ServerIPValidator.isReachable]
    });
    this.storage.get("ServerIp").then(serverip => {
      if (serverip) {
        (<FormControl>this.regForm.controls['ServerIp']).setValue(serverip);
      } else {
        (<FormControl>this.regForm.controls['ServerIp']).setValue(this.defaultServer);
      }
    });

    this.storage.get("Autostart").then(autostart => {
      if (autostart != null) {
        this.toggleStatus = autostart
      }
      else {
        this.toggleStatus = false;
      }
    });

  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  saveChanges() {
    this.storage.set("Autostart", this.toggleStatus);
    if (this.toggleStatus) {
      this.autostart.enable();
    }
    else {
      this.autostart.disable();
    }
    let address = (<FormControl>this.regForm.controls['ServerIp']).value;
    console.log("ADRESS" + address)
    this.tokenService.url = address;
    this.tokenService.loadToken().first().retry(2).subscribe(token => {
      console.log('MyNew Token', token);
      this.webSocketService.closeStompClient();
      this.webSocketService.initializeStompClient(address);
      this.storage.set("ServerIp", address)
      this.dismiss();

    });
  }
}
