import { useEffect, useState } from "react";
import type { BaseViewModel } from "@/viewmodels/BaseViewModel";

export function useViewModelState<TState extends object>(viewModel: BaseViewModel<TState>): Readonly<TState> {
  const [state, setState] = useState<Readonly<TState>>(viewModel.snapshot);

  useEffect(() => viewModel.subscribe(setState), [viewModel]);

  return state;
}
