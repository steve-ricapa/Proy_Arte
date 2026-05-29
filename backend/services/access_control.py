from __future__ import annotations

import random
import time
from dataclasses import dataclass


@dataclass
class CooldownState:
    until: float = 0.0
    reason: str = ""
    failures: int = 0


class InstagramAccessController:
    def __init__(self) -> None:
        self.global_state = CooldownState()
        self.profile_states: dict[str, CooldownState] = {}

    def can_run(self, username: str) -> tuple[bool, int, str]:
        now = time.time()
        global_left = max(0, int(self.global_state.until - now))
        if global_left > 0:
            return False, global_left, self.global_state.reason or "cooldown_global"

        state = self.profile_states.get(username.lower())
        if not state:
            return True, 0, ""

        left = max(0, int(state.until - now))
        if left > 0:
            return False, left, state.reason or "cooldown_profile"

        return True, 0, ""

    def register_success(self, username: str) -> None:
        key = username.lower()
        if key in self.profile_states:
            self.profile_states[key] = CooldownState()

    def register_failure(self, username: str, error_type: str) -> int:
        key = username.lower()
        state = self.profile_states.setdefault(key, CooldownState())
        state.failures += 1

        duration = self._cooldown_for(error_type, state.failures)
        state.until = max(state.until, time.time() + duration)
        state.reason = error_type

        if error_type in {"401_wait", "403", "429"}:
            self.global_state.failures += 1
            if self.global_state.failures >= 3:
                global_duration = min(6 * 60 * 60, duration)
                self.global_state.until = max(self.global_state.until, time.time() + global_duration)
                self.global_state.reason = error_type

        return duration

    def status(self) -> dict[str, object]:
        now = time.time()
        return {
            "global_cooldown_seconds": max(0, int(self.global_state.until - now)),
            "global_reason": self.global_state.reason,
            "profiles_in_cooldown": {
                username: {
                    "seconds_left": max(0, int(state.until - now)),
                    "reason": state.reason,
                    "failures": state.failures,
                }
                for username, state in self.profile_states.items()
                if state.until > now
            },
        }

    @staticmethod
    def _cooldown_for(error_type: str, failures: int) -> int:
        jitter = random.randint(20, 120)
        if error_type == "checkpoint":
            return 24 * 60 * 60 + jitter
        if error_type in {"401_wait", "403", "429"}:
            base = min(15 * 60 * (2 ** max(0, failures - 1)), 6 * 60 * 60)
            return base + jitter
        if error_type in {"wrong_password_suspected", "login_required", "apify_auth", "missing_token"}:
            return 2 * 60 * 60 + jitter
        return 10 * 60 + jitter
