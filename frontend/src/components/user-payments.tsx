import {
  Alert,
  Button,
  ListGroup,
  ListGroupItem,
  Spinner,
} from "@vseth/components";
import moment from "moment";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../auth";
import GlobalConsts from "../globalconsts";
import {
  useAddPayments,
  usePayments,
  useRefundPayment,
  useRemovePayment,
} from "../api/hooks";
import Grid from "./grid";

interface UserPaymentsProps {
  username: string;
}
const UserPayments: React.FC<UserPaymentsProps> = ({ username }) => {
  const user = useUser()!;
  const isAdmin = user.isAdmin;
  const isMyself = username === user.username;
  const [
    paymentsError,
    paymentsLoading,
    payments,
    reloadPayments,
  ] = usePayments(username, isMyself);
  const [refundError, refundLoading, refund] = useRefundPayment(reloadPayments);
  const [removeError, removeLoading, remove] = useRemovePayment(reloadPayments);
  const [addError, addLoading, add] = useAddPayments(reloadPayments);
  const error = paymentsError || refundError || removeError || addError;
  const loading =
    paymentsLoading || refundLoading || removeLoading || addLoading;
  const [openPayment, setOpenPayment] = useState("");
  return (
    <>
      {error && <Alert color="danger">{error.toString()}</Alert>}
      <h3>Paid Oral Exams</h3>
      {loading && <Spinner />}
      {payments && (payments.length > 0 || isAdmin) && (
        <>
          {payments
            .filter((payment) => payment.active)
            .map((payment) => (
              <Alert key={payment.oid}>
                You have paid for all oral exams until{" "}
                {moment(
                  payment.valid_until,
                  GlobalConsts.momentParseString,
                ).format(GlobalConsts.momentFormatStringDate)}
                .
              </Alert>
            ))}
          <Grid>
            {payments.map((payment) =>
              openPayment === payment.oid ? (
                <ListGroup key={payment.oid} onClick={() => setOpenPayment("")}>
                  <ListGroupItem>
                    Payment Time:{" "}
                    {moment(
                      payment.payment_time,
                      GlobalConsts.momentParseString,
                    ).format(GlobalConsts.momentFormatString)}
                  </ListGroupItem>
                  <ListGroupItem>
                    Valid Until:{" "}
                    {moment(
                      payment.valid_until,
                      GlobalConsts.momentParseString,
                    ).format(GlobalConsts.momentFormatStringDate)}
                  </ListGroupItem>
                  {payment.refund_time && (
                    <ListGroupItem>
                      Refund Time:{" "}
                      {moment(
                        payment.refund_time,
                        GlobalConsts.momentParseString,
                      ).format(GlobalConsts.momentFormatString)}
                    </ListGroupItem>
                  )}
                  {payment.uploaded_filename && (
                    <ListGroupItem>
                      <Link to={`/exams/${payment.uploaded_filename}`}>
                        Uploaded Transcript
                      </Link>
                    </ListGroupItem>
                  )}
                  {isAdmin && (
                    <ListGroupItem>
                      {!payment.refund_time && (
                        <Button onClick={() => refund(payment.oid)} className="mr-1">
                          Mark Refunded
                        </Button>
                      )}
                      <Button onClick={() => remove(payment.oid)}>
                        Remove Payment
                      </Button>
                    </ListGroupItem>
                  )}
                </ListGroup>
              ) : (
                <ListGroup
                  key={payment.oid}
                  onClick={() => setOpenPayment(payment.oid)}
                >
                  <ListGroupItem>
                    Payment Time:{" "}
                    {moment(
                      payment.payment_time,
                      GlobalConsts.momentParseString,
                    ).format(GlobalConsts.momentFormatString)}
                  </ListGroupItem>
                </ListGroup>
              ),
            )}
          </Grid>
        </>
      )}
      {isAdmin &&
        payments &&
        payments.filter((payment) => payment.active).length === 0 && (
          <Button className="my-3" onClick={() => add(username)}>
            Add Payment
          </Button>
        )}
    </>
  );
};
export default UserPayments;
