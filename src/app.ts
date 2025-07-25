import {Component, OnDestroy, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Subscription} from 'rxjs';
import {WebsocketService} from './common/services/websocket.service';
import {HttpClient} from '@angular/common/http';

interface ServerConfig {
  ip: string;
}

@Component({
  selector: 'lin-root',
  template: `
    <router-outlet/>
  `,
  imports: [
    RouterOutlet
  ]
})
export class App implements OnInit, OnDestroy {
  private readonly wsSub?: Subscription;

  constructor(
    private readonly wsService: WebsocketService,
    private readonly http: HttpClient
  ) {
  }

  ngOnInit(): void {
    this.http.get<ServerConfig>('/server-config.json').subscribe({
      next: (config) => {
        const wsUrl = `ws://${config.ip}:3333`;
        this.wsService.connect(wsUrl);
      },
      error: (err): void => {
        console.error('Error loading config:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
  }
}
