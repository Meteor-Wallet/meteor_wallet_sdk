import { Icon, IconButton, IconButtonProps } from "@chakra-ui/react";
import React from "react";
import { FiChevronLeft } from "react-icons/all";
import { UiDirectReference } from "../../state/ui_store/UiDirectReferences";

export interface ICPComponent_NavigateBackButton extends Partial<IconButtonProps> {
  onClick?: () => void;
  [props: string]: any;
}

export const Component_NavigateBackButton: React.FC<ICPComponent_NavigateBackButton> = ({
  onClick,
  ...props
}) => {
  // const navigate = useNavigate();

  return (
    <IconButton
      zIndex={99}
      variant={"keyNavigation"}
      onClick={
        onClick ??
        (() => {
          UiDirectReference.getNavigate()(-1);
        })
      }
      size="sm"
      // opacity={"0.15"}
      icon={<Icon mr={"0.1em"} as={FiChevronLeft} boxSize={"1.5em"} />}
      aria-label="Back"
      {...props}
    />
  );
};
