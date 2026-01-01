import { LoadingOverlayProps, LoadingOverlay as Original } from "@mantine/core";

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ ...props }) => {
  return (
    <Original
      transitionProps={{ transition: "fade", duration: 500 }}
      overlayProps={{ color: "gray", opacity: 0.3 }}
      {...props}
    />
  );
};

export default LoadingOverlay;
