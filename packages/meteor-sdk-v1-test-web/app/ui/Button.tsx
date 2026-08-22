export const Button = ({
  onClick,
  children,
  disabled = false,
  active = false,
}: {
  onClick: () => void;
  children: any;
  disabled?: boolean;
  active?: boolean;
}) => {
  let buttonStateStyle = "bg-blue-600 hover:bg-blue-700 border-black cursor-pointer";

  if (active) {
    buttonStateStyle = "bg-blue-900 border-indigo-500 cursor-pointer";
  }

  if (disabled) {
    buttonStateStyle = "bg-gray-500 border-black cursor-not-allowed";
  }

  return (
    <button
      className={`rounded-3xl border-2 text-white py-2 px-4 transition-colors ${buttonStateStyle}`}
      // `disabled` used to select a grey class and nothing else — no attribute, no guard — so every
      // gate built on it across this app was decorative: the button looked unavailable and fired
      // anyway. That is how a second "Run AddKeys" got through and met a transfer whose start
      // result the SDK had already, correctly, discarded.
      disabled={disabled}
      aria-disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onClick();
      }}
    >
      {children}
    </button>
  );
};
