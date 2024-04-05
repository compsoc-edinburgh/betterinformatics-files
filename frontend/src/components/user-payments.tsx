import { Alert, Button, List, Loader } from "@mantine/core";
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
  const [paymentsError, paymentsLoading, payments, reloadPayments] =
    usePayments(username, isMyself);
  const [refundError, refundLoading, refund] = useRefundPayment(reloadPayments);
  const [removeError, removeLoading, remove] = useRemovePayment(reloadPayments);
  const [addError, addLoading, add] = useAddPayments(reloadPayments);
  const error = paymentsError || refundError || removeError || addError;
  const loading =
    paymentsLoading || refundLoading || removeLoading || addLoading;
  const [openPayment, setOpenPayment] = useState("");
  return (
    <div>
      {error && <Alert color="red">{error.toString()}</Alert>}
      <h3>Paid Oral Exams</h3>
      {payments && (payments.length > 0 || isAdmin) && (
        <>
          {payments
            .filter(payment => payment.active)
            .map(payment => (
              <Alert mb="xs" key={payment.oid}>
                You have paid for all oral exams until{" "}
                {moment(
                  payment.valid_until,
                  GlobalConsts.momentParseString,
                ).format(GlobalConsts.momentFormatStringDate)}
                .
              </Alert>
            ))}
          <Grid>
            {payments.map(payment =>
              openPayment === payment.oid ? (
                <List key={payment.oid} onClick={() => setOpenPayment("")}>
                  <div>
                    Payment Time:{" "}
                    {moment(
                      payment.payment_time,
                      GlobalConsts.momentParseString,
                    ).format(GlobalConsts.momentFormatString)}
                  </div>
                  <div>
                    Valid Until:{" "}
                    {moment(
                      payment.valid_until,
                      GlobalConsts.momentParseString,
                    ).format(GlobalConsts.momentFormatStringDate)}
                  </div>
                  {payment.refund_time && (
                    <div>
                      Refund Time:{" "}
                      {moment(
                        payment.refund_time,
                        GlobalConsts.momentParseString,
                      ).format(GlobalConsts.momentFormatString)}
                    </div>
                  )}
                  {payment.uploaded_filename && (
                    <div>
                      <Link
                        color="dark"
                        to={`/exams/${payment.uploaded_filename}`}
                      >
                        Uploaded Transcript
                      </Link>
                    </div>
                  )}
                  {isAdmin && (
                    <div>
                      {!payment.refund_time && (
                        <Button onClick={() => refund(payment.oid)} mr="xs">
                          Mark Refunded
                        </Button>
                      )}
                      <Button onClick={() => remove(payment.oid)}>
                        Remove Payment
                      </Button>
                    </div>
                  )}
                </List>
              ) : (
                <List
                  key={payment.oid}
                  onClick={() => setOpenPayment(payment.oid)}
                >
                  <div>
                    Payment Time:{" "}
                    {moment(
                      payment.payment_time,
                      GlobalConsts.momentParseString,
                    ).format(GlobalConsts.momentFormatString)}
                  </div>
                </List>
              ),
            )}
          </Grid>
        </>
      )}
      {isAdmin &&
        payments &&
        payments.filter(payment => payment.active).length === 0 && (
          <Button onClick={() => add(username)}>Add Payment</Button>
        )}
    </div>
  );
};
export default UserPayments;
