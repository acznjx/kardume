import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Limite de erro: se algo dentro dele quebrar (ex.: um canvas 3D desmontado no meio da criação),
 * mostra o `reserva` em vez de derrubar a página inteira.
 */
export class Contencao extends Component<{ children: ReactNode; reserva?: ReactNode }, { erro: boolean }> {
  state = { erro: false };

  static getDerivedStateFromError() {
    return { erro: true };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.warn('[Kardume] erro contido:', erro.message, info.componentStack?.split('\n')[1]?.trim());
  }

  render() {
    return this.state.erro ? (this.props.reserva ?? null) : this.props.children;
  }
}
