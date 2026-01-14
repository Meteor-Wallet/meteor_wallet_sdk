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
  let buttonStateStyle = "bg-blue-600 hover:bg-blue-700 border-black";

  if (active) {
    buttonStateStyle = "bg-blue-900 border-indigo-500";
  }

  if (disabled) {
    buttonStateStyle = "bg-gray-500 border-black";
  }

  return (
    <button
      className={`cursor-pointer rounded-3xl border-2 text-white py-2 px-4 transition-colors ${buttonStateStyle}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
