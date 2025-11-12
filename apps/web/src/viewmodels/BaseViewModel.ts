export type Listener<TState> = (state: Readonly<TState>) => void;

export class BaseViewModel<TState extends object> {
  private listeners = new Set<Listener<TState>>();
  protected state: TState;

  constructor(initialState: TState) {
    this.state = initialState;
  }

  get snapshot(): Readonly<TState> {
    return this.state;
  }

  subscribe(listener: Listener<TState>): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  protected setState(partial: Partial<TState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
