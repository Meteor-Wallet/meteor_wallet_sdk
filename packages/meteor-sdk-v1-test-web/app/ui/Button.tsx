export const Button = ({
  onClick,
  children,
  active = false,
}: {
  onClick: () => void;
  children: any;
  active?: boolean;
}) => {
  return (
    <button
      className={`cursor-pointer rounded-3xl border-2 ${active ? "bg-blue-900 border-indigo-500" : "bg-blue-600 border-black"} text-white py-2 px-4 ${active ? "" : "hover:bg-blue-700"} transition-colors`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
