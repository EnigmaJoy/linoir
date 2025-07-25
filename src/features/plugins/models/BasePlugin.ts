import {PluginManifest, PluginVariant} from '../services/plugin-loader.service';
import {Message, WebsocketService} from '../../../common/services/websocket.service';
import {Observable, Subject} from 'rxjs';
import {RenderType} from '../../render/enums/render-type';

export interface BaseMessagePayload {
  active: boolean;
}

export abstract class BasePlugin<GenericConfig extends BaseMessagePayload = BaseMessagePayload> {

  private readonly _variants: Map<RenderType, PluginVariant> = new Map<RenderType, PluginVariant>();
  private readonly _configurationChangeEvent$: Subject<void> = new Subject<void>();
  public configurationChangeEvent: Observable<void> = this._configurationChangeEvent$.asObservable();

  public key(): string {
    return this.manifest.key;
  }

  public scope(scope: RenderType): string {
    return this._variants.get(scope)?.scope ?? '';
  }

  public componentName(scope: RenderType): string {
    return this._variants.get(scope)?.componentName ?? '';
  }

  protected constructor(
    private readonly manifest: PluginManifest,
    protected readonly webSocketService: WebsocketService
  ) {
    this.listenTopic().subscribe((res: Message<GenericConfig>): void => {
      this.configuration = res.payload;
    });
  }

  public addVariant(scope: RenderType, variant: PluginVariant): void {
    this._variants.set(scope, variant);
  }

  public set configuration(configuration: GenericConfig) {
    localStorage.setItem(`${this.key()}`, JSON.stringify(configuration));
    this._configurationChangeEvent$.next();
  }

  public get configuration(): GenericConfig {
    const storedMemoryJson: string = localStorage.getItem(`${this.key()}`)!;
    return JSON.parse(storedMemoryJson) as GenericConfig;
  }

  public toggle(): void {
    const currentConfig: GenericConfig = this.configuration;
    const newConfiguration: GenericConfig = {...currentConfig, active: !currentConfig.active};
    this.sendMessage(newConfiguration)
  }

  public listenTopic(): Observable<Message<GenericConfig>> {
    return this.webSocketService.subscribe<GenericConfig>(this.key());
  }

  public sendMessage(message: GenericConfig): void {
    this.webSocketService.send<GenericConfig>({
      topic: this.key(),
      payload: message
    });
  }
}
