import { Alert, FormGroup, Label, Input } from "@vseth/components";
import React from "react";
import {
  useEnabledNotifications,
  useSetEnabledNotifications,
} from "../api/hooks";

interface UserNotificationsProps {
  username: string;
}
const UserNotificationsSettings: React.FC<UserNotificationsProps> = ({
  username,
}) => {
  const [enabledError, enabledLoading, enabled, reloadEnabled] =
    useEnabledNotifications(true);
  const [setEnabledError, setEnabledLoading, setEnabled] =
    useSetEnabledNotifications(reloadEnabled);
  const error = enabledError || setEnabledError;
  const checkboxLoading = enabledLoading || setEnabledLoading;
  return (
    <>
      <h3>Notifications</h3>
      {error && <Alert color="danger">{error.toString()}</Alert>}
      <FormGroup check>
        <Input
          type="checkbox"
          id="commentToMyAnswer"
          checked={enabled ? enabled.has(1) : false}
          disabled={checkboxLoading}
          onChange={e => setEnabled(1, e.currentTarget.checked)}
        />
        <Label for="commentToMyAnswer" check>
          Comment to my answer
        </Label>
      </FormGroup>
      <FormGroup check>
        <Input
          type="checkbox"
          id="commentToMyComment"
          checked={enabled ? enabled.has(2) : false}
          disabled={checkboxLoading}
          onChange={e => setEnabled(2, e.currentTarget.checked)}
        />
        <Label for="commentToMyComment" check>
          Comment to my comment
        </Label>
      </FormGroup>
      <FormGroup check>
        <Input
          type="checkbox"
          id="otherAnswerToSameQuestion"
          checked={enabled ? enabled.has(3) : false}
          disabled={checkboxLoading}
          onChange={e => setEnabled(3, e.currentTarget.checked)}
        />
        <Label for="otherAnswerToSameQuestion" check>
          Other answer to same question
        </Label>
      </FormGroup>
      <FormGroup check>
        <Input
          type="checkbox"
          id="commentToMyDocument"
          checked={enabled ? enabled.has(4) : false}
          disabled={checkboxLoading}
          onChange={e => setEnabled(4, e.currentTarget.checked)}
        />
        <Label for="commentToMyDocument" check>
          Comment to my document
        </Label>
      </FormGroup>
    </>
  );
};
export default UserNotificationsSettings;
