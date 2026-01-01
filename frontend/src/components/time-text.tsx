import { Tooltip, TextProps, Text } from "@mantine/core";
import { formatDistanceToNow, format } from "date-fns";
import React from "react";

export interface TimeTextProps extends TextProps {
    time: string;
    prefix?: string;
    suffix?: string;
}

const TimeText: React.FC<TimeTextProps> = ({ time, prefix, suffix, ...textProps }) => {
    return (
        <Tooltip withArrow withinPortal label={format(new Date(time), "PPp")} >
            <Text color="dimmed" component="span">
                {prefix} {formatDistanceToNow(new Date(time))} {suffix}
            </Text>
        </Tooltip>
    );
}
export default TimeText;
