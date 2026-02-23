import { ChangeEvent, Dispatch, SetStateAction } from "react";
import { DebouncedState } from "use-debounce";

export class UIEventsHandler {
	onTextInputChange(
		setState: Dispatch<SetStateAction<string>>,
		onDebouncedValueChange?: DebouncedState<() => void>,
	) {
		return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			setState(e.target.value);

			if (onDebouncedValueChange) {
				onDebouncedValueChange();
			}
		};
	}

	toggleBooleanState(
		setState: React.Dispatch<React.SetStateAction<boolean>>,
	) {
		return () => setState((prev) => !prev);
	}
}
