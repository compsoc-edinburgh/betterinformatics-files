import { LoadingOverlayProps, LoadingOverlay as Original } from "@mantine/core";

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ ...props }) => {
  return (
    <Original
      overlayOpacity={0.1}
      transitionDuration={500}
      overlayColor="gray"
      {...props}
    />
  );
}

export default LoadingOverlay;
