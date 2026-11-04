import sys

stats = sys.modules["uc.stats"]
fix = stats._repair_change


def test_normal_change_kept():
    assert fix(40.5, 19000.0, 19040.5) == 40.5


def test_sum_reset_after_gap_uses_state_difference():
    # odometer: 19 474.0 before a 12-day gap, 20 052.3 after; HA restarted the sum at 0
    assert round(fix(-19201.5, 19474.0, 20052.3), 1) == 578.3


def test_real_decrease_kept_for_net_meters():
    assert fix(-3.0, 100.0, 97.0) == -3.0


def test_no_state_keeps_change():
    assert fix(-5.0, None, 10.0) == -5.0
