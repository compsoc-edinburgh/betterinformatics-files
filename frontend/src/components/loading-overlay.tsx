import { LoadingOverlayProps, LoadingOverlay as Original } from "@mantine/core";

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ ...props }) => {
  return (
    <Original
      opacity={0.3}
      transitionProps={{ transition: "fade", duration: 500 }}
      overlayProps={{ color: "gray" }}
      {...props}
    />
  );
};

export default LoadingOverlay;
