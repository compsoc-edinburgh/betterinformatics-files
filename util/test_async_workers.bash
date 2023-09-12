# Tests if the backend is correctly able to handle a lot of slow requests.

function slowquery {
  echo "[INFO] Starting long runnung request - Should keep all workers busy"
  curl localhost:8081/api/debug/long_running_db/ || (echo "==== [FAIL] ======== Long running db not available" 1>&2 && return 1)
  echo "[INFO] Long request handled successfully"
}

nb_timeouts=0

function healthcheck {
  timeout 2 curl localhost:8081/health || (echo "==== [FAIL] ======== Healthcheck timed out" 1>&2 && return 1 && nb_timeouts=$nb_timeouts+1)
  echo "[INFO] Healthcheck success"
}

for i in {1..20}
do
  slowquery&
done

while true; do
  healthcheck&
  sleep 1
done

