import { Button, ButtonProps } from "@mantine/core";
import Shimmer from "../assets/shimmer.svg?react";
import Star from "../assets/star.svg?react";
import React, { forwardRef } from "react";
import classes from "./shimmer-button.module.css";
import clsx from "clsx";

interface ShimmerButtonProps extends ButtonProps {
  onClick?: any;
}

const ShimmerButton: React.FC<
  ShimmerButtonProps & React.RefAttributes<HTMLButtonElement>
> = forwardRef(({ children, onClick, ...buttonProps }, ref) => {
  const useDarkEffects = buttonProps.variant === "outline";
  return (
    <Button
      {...buttonProps}
      onClick={onClick}
      className={classes.button}
      ref={ref}
    >
      {children}
      <Shimmer
        className={clsx(
          classes.shimmer,
          useDarkEffects ? classes.darkshimmer : classes.lightshimmer,
        )}
      />
      <div>
        <Star
          className={clsx(
            classes.star,
            useDarkEffects ? classes.darkStar : classes.lightStar,
          )}
        />
        <Star
          className={clsx(
            classes.star,
            useDarkEffects ? classes.darkStar : classes.lightStar,
          )}
        />
        <Star
          className={clsx(
            classes.star,
            useDarkEffects ? classes.darkStar : classes.lightStar,
          )}
        />
        <Star
          className={clsx(
            classes.star,
            useDarkEffects ? classes.darkStar : classes.lightStar,
          )}
        />
        <Star
          className={clsx(
            classes.star,
            useDarkEffects ? classes.darkStar : classes.lightStar,
          )}
        />
      </div>
    </Button>
  );
});
export default ShimmerButton;
