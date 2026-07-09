import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "1m",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<3000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";
const LIMIT = Number(__ENV.LIMIT || 50);
const USERNAME_PREFIX = __ENV.USERNAME_PREFIX || "stress.demo";

export default function () {
  const username = `${USERNAME_PREFIX}.${__VU % 4}`;
  const payload = JSON.stringify({ username, limit: LIMIT });
  const response = http.post(`${BASE_URL}/analyze-profile`, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: "180s",
  });

  check(response, {
    "status is 200": (r) => r.status === 200,
    "response source exists": (r) => {
      try {
        return Boolean(r.json("source"));
      } catch {
        return false;
      }
    },
    "posts array exists": (r) => {
      try {
        return Array.isArray(r.json("posts"));
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
