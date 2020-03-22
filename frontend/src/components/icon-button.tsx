import { Button, ButtonProps, Icon, ICONS, Spinner } from "@vseth/components";
import { css } from "emotion";
import React from "react";
const childStyle = css`
  padding-left: 0.8em;
`;
interface IconButtonProps extends ButtonProps {
  icon: keyof typeof ICONS;
  loading?: boolean;
}
const IconButton: React.FC<IconButtonProps> = ({
  size,
  loading,
  icon,
  disabled,
  children,
  ...props
}) => {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      style={{ minWidth: 0 }}
      size={size}
    >
      {loading ? (
        <Spinner size={size} />
      ) : (
        <>
          <Icon icon={ICONS[icon]} size={size === "lg" ? 20 : 18} />
        </>
      )}
      {children && <span className={childStyle}>{children}</span>}
    </Button>
  );
};
export default IconButton;
